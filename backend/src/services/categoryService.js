const categoryRepository = require('../db/categoryRepository');
// Necesitamos el repositorio de transacciones para verificar si la categoría está en uso.
const transactionRepository = require('../db/transactionRepository'); 

/**
 * Lógica de negocio para crear una categoría.
 */
exports.create = async (user_id, name, type) => {
    // 1. Validaciones básicas de negocio (el controlador ya ejecutó las de campos obligatorios, 
    // pero el servicio asegura otras reglas).
    if (!name || !type) {
        // En un servicio, lanzamos errores que pueden incluir un status para el controlador.
        const err = new Error('El nombre y el tipo de categoría son obligatorios.');
        err.status = 400; 
        throw err;
    }
    if (!['income', 'expense'].includes(type)) {
        const err = new Error('Tipo de categoría inválido. Debe ser "income" o "expense".');
        err.status = 400; 
        throw err;
    }
    
    // 2. Acceso a la capa de datos (Repositorio)
    try {
        const category = await categoryRepository.createCategory(user_id, name.trim(), type);
        return category;
    } catch (error) {
        // Manejamos el error de violación de unicidad de la base de datos (código 23505)
        if (error.code === '23505') {
             const err = new Error('Ya existe una categoría con ese nombre para este usuario.');
             err.status = 400; // BadRequest
             throw err;
        }
        // Relanzar otros errores de DB como 500
        throw error; 
    }
};

/**
 * Obtiene todas las categorías de un usuario.
 */
exports.get = async (user_id) => {
    // No hay mucha lógica de negocio, solo pasamos la solicitud al repositorio.
    return categoryRepository.getUsersCategories(user_id);
};

/**
 * Lógica de negocio para eliminar una categoría.
 * Incluye la regla de verificar movimientos antes de eliminar (regla de negocio principal).
 */
exports.remove = async (category_id, user_id) => {
    // 1. Regla de negocio: Verificar si la categoría tiene transacciones.
    const transactionCount = await categoryRepository.countTransactionsInCategory(category_id);
    
    if (transactionCount > 0) {
        // Lanzamos un error de negocio específico (status 400)
        const err = new Error('No se puede eliminar una categoría que tiene movimientos asociados');
        err.status = 400; 
        throw err;
    }
    
    // 2. Acceso a la capa de datos (Repositorio) para eliminar
    const wasDeleted = await categoryRepository.deleteCategory(category_id, user_id);

    if (!wasDeleted) {
        // Si no se eliminó (porque no existía o no era del usuario)
        const err = new Error('Categoría no encontrada o no pertenece al usuario.');
        err.status = 404;
        throw err;
    }

    return { message: 'Categoría eliminada exitosamente' };
};
