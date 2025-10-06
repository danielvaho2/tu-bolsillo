import * as transactionRepo from '../db/transactionRepository.js'; // Importación global
import * as categoryRepository from '../db/categoryRepository.js'; 
import { pool } from '../config/db.config.js'; 

// ---------------------------------------------
// SERVICIO DE TRANSACCIONES
// ---------------------------------------------

/**
 * Crea una nueva transacción.
 * @param {number} userId - ID del usuario.
 * @param {number} categoryId - ID de la categoría.
 * @param {string} description - Descripción del movimiento.
 * @param {number} amount - Monto.
 * @param {string} date - Fecha (YYYY-MM-DD).
 * @returns {Promise<Object>} La transacción creada.
 */
export const createTransaction = async (userId, categoryId, description, amount, date) => {
    // 1. Verificar si la categoría existe y si el usuario es el dueño
    const categories = await categoryRepository.findCategoriesByUserId(userId);
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
        const error = new Error('Categoría no encontrada o no pertenece al usuario.');
        error.status = 404;
        throw error;
    }
    const type = category.type; // Obtenemos el tipo de la categoría (income/expense)


    // 2. Crear la transacción
    try {
        // Llama a la función desde el alias 'transactionRepo'
        return await transactionRepo.createTransaction( 
            userId, 
            categoryId, 
            description, 
            amount, 
            type, // Usamos el tipo de la categoría
            date
        );
    } catch (error) {
        console.error('Error en createTransaction Service:', error);
        throw new Error('Error al crear la transacción.');
    }
};

/**
 * Obtiene todas las transacciones de un usuario.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} Lista de transacciones.
 */
export const getTransactions = async (userId) => {
    try {
        // Llama a la función desde el alias 'transactionRepo'
        return await transactionRepo.findTransactionsByUserId(userId); 
    } catch (error) {
        console.error('Error en getTransactions Service:', error);
        throw new Error('No se pudieron recuperar las transacciones.');
    }
};

/**
 * Obtiene el resumen financiero para el dashboard.
 * @param {number} userId - ID del usuario.
 * @param {string} startDate - Fecha de inicio.
 * @param {string} endDate - Fecha de fin.
 * @returns {Promise<Object>} Resumen financiero.
 */
export const getDashboardData = async (userId, startDate, endDate) => {
    try {
        // Llama a la función getFinancialSummary desde el alias 'transactionRepo'
        return await transactionRepo.getFinancialSummary(userId, startDate, endDate);
    } catch (error) {
        console.error('Error en getDashboardData Service:', error);
        throw new Error('Error al obtener datos del dashboard.');
    }
};

/**
 * Elimina una transacción.
 * @param {number} transactionId - ID de la transacción.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<void>}
 */
export const deleteTransactionService = async (transactionId, userId) => {
    try {
        // Llama a la función desde el alias 'transactionRepo'
        const deleted = await transactionRepo.deleteTransaction(transactionId, userId);
        if (!deleted) {
            const notFoundError = new Error('Transacción no encontrada o no pertenece al usuario.');
            notFoundError.status = 404;
            throw notFoundError;
        }
    } catch (error) {
        console.error('Error en deleteTransaction Service:', error);
        throw new Error('Error al eliminar la transacción.');
    }
};

// Se deben exportar todas las funciones que se usan en server.js
// Asumiendo que las funciones "create", "getAll" y "remove" son aliases 
// o funciones específicas para movimientos:

export const create = createTransaction; 
export const getAll = getTransactions;
export const remove = deleteTransactionService;
export const getAnalysis = getDashboardData; // Se asume que getAnalysis usa la misma lógica

// Exportaciones de funciones de servicio
// Nótese que se usa 'export const' para la sintaxis de ES Modules.