const transactionRepository = require('../db/transactionRepository');
const categoryRepository = require('../db/categoryRepository'); // Necesario para validaciones de categoría

/**
 * Función auxiliar para generar la condición SQL y el parámetro de fecha 
 * necesario para filtrar movimientos por rango de tiempo.
 */
const getDateCondition = (range) => {
    let dateCondition = '';
    let dateParam = null;
    let startDate = null;
    const now = new Date();

    switch (range) {
        case 'month':
            // Inicio del mes actual
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); 
            break;
        case '3months':
            // Inicio de hace 3 meses
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); 
            break;
        case '6months':
            // Inicio de hace 6 meses
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); 
            break;
        case 'year':
            // Hace 1 año
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); 
            break;
        case 'all':
        default:
            return { dateCondition, dateParam }; // No se aplica filtro
    }

    if (startDate) {
        // La condición para el SQL será ' AND date >= $2'
        dateCondition = ' AND date >= $2';
        
        // Formateamos la fecha a YYYY-MM-DD
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        dateParam = `${year}-${month}-${day}`;
    }
    
    return { dateCondition, dateParam };
};


/**
 * Crea un nuevo movimiento (ingreso o gasto).
 */
exports.create = async (user_id, description, amount, category_id, type) => {
    // 1. Regla de Negocio: Verificar que la categoría exista y que su tipo coincida.
    // Usamos el repositorio de categorías para hacer esta doble verificación.
    const category = await categoryRepository.getCategoryByIdAndType(category_id, user_id, type);

    if (!category) {
        const err = new Error('Categoría no válida o el tipo de movimiento no coincide con el tipo de categoría.');
        err.status = 400; // Lo marcamos como 400 para que el controlador lo use
        throw err;
    }

    // 2. Crear la transacción en la DB
    return transactionRepository.createTransaction(
        user_id, 
        description.trim(), 
        amount, 
        category_id, 
        type
    );
};

/**
 * Elimina un movimiento existente.
 */
exports.remove = async (movement_id, user_id) => {
    // 1. Eliminar el movimiento (el repositorio se asegura de que solo se elimine si es del usuario)
    const wasDeleted = await transactionRepository.deleteTransaction(movement_id, user_id);

    if (!wasDeleted) {
        const err = new Error('Movimiento no encontrado o no pertenece al usuario.');
        err.status = 404;
        throw err;
    }

    return { message: 'Movimiento eliminado exitosamente' };
};

/**
 * Obtiene la lista completa de movimientos de un usuario.
 */
exports.getAll = async (user_id) => {
    // 1. Obtener todos los movimientos del usuario (incluyendo el nombre de la categoría)
    return transactionRepository.getUsersTransactions(user_id);
};

/**
 * Obtiene los datos de resumen para el Dashboard (Ingresos, Gastos, Saldo, Resumen por Categoría).
 */
exports.getDashboardData = async (user_id) => {
    // 1. Obtener resumen financiero (ingresos vs gastos totales)
    const summaryResult = await transactionRepository.getFinancialSummary(user_id);
    const summary = summaryResult[0] || { total_income: '0', total_expenses: '0' };

    // Conversión y cálculo de balance
    const income = parseFloat(summary.total_income) || 0;
    const expenses = parseFloat(summary.total_expenses) || 0;
    const balance = income - expenses;

    // 2. Obtener resumen de gastos/ingresos por categoría
    const categoriesResult = await transactionRepository.getCategorySummary(user_id);
    const categories = categoriesResult.map(cat => ({
        ...cat,
        // Aseguramos que el monto sea un número
        amount: parseFloat(cat.amount) || 0 
    }));

    // 3. Devolver los datos estructurados
    return { 
        financialData: { income, expenses, balance }, 
        categories 
    };
};

/**
 * Obtiene todos los movimientos y categorías dentro de un rango de análisis específico.
 */
exports.getAnalysis = async (user_id, range = 'all') => {
    // 1. Lógica de Negocio: Determinar la condición de fecha para la DB
    const { dateCondition, dateParam } = getDateCondition(range);
    
    // 2. Acceso a la capa de datos (Repositorio) para obtener todos los movimientos en el rango
    const analysisData = await transactionRepository.getAnalysisData(user_id, dateCondition, dateParam);
    
    // 3. Transformar los datos a un formato más limpio
    const movements = analysisData.map(row => ({
        id: row.id,
        description: row.description,
        amount: parseFloat(row.amount) || 0,
        type: row.type,
        date: row.date,
        category_id: row.category_id,
        category_name: row.category_name
    }));

    // 4. Extraer las categorías únicas presentes en estos movimientos (para usarlas en gráficos)
    const categoriesMap = new Map();
    analysisData.forEach(row => {
        if (!categoriesMap.has(row.category_id)) {
            categoriesMap.set(row.category_id, {
                id: row.category_id,
                name: row.category_name,
                type: row.category_type
            });
        }
    });
    const categories = Array.from(categoriesMap.values());

    return { 
        movements, 
        categories,
        summary: {
            totalTransactions: movements.length,
            dateRange: range,
            hasData: movements.length > 0
        }
    };
};
