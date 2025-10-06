import * as categoryRepository from '../db/categoryRepository.js'; // Usar import y .js
import * as transactionRepository from '../db/transactionRepository.js'; // Usar import y .js

// ---------------------------------------------
// SERVICIO DE CATEGORÍAS
// ---------------------------------------------

/**
 * Obtiene todas las categorías de un usuario.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} Lista de categorías.
 */
export const get = async (userId) => {
    try {
        return await categoryRepository.findCategoriesByUserId(userId);
    } catch (error) {
        console.error('Error en get categories Service:', error);
        throw new Error('Error al obtener categorías.');
    }
};

/**
 * Crea una nueva categoría.
 * @param {number} userId - ID del usuario.
 * @param {string} name - Nombre de la categoría.
 * @param {('income'|'expense')} type - Tipo de categoría.
 * @returns {Promise<Object>} La categoría creada.
 */
export const create = async (userId, name, type) => {
    try {
        return await categoryRepository.createCategory(userId, name, type);
    } catch (error) {
        // Asumimos que el error de duplicidad se maneja aquí o se pasa al controlador
        console.error('Error en create category Service:', error);
        throw new Error('Error al crear la categoría. Podría ya existir.');
    }
};

/**
 * Elimina una categoría, verificando primero que no tenga transacciones asociadas.
 * @param {number} categoryId - ID de la categoría.
 * @param {number} userId - ID del usuario para verificación de propiedad.
 * @returns {Promise<{message: string}>} Mensaje de éxito.
 */
export const remove = async (categoryId, userId) => {
    try {
        // 1. Verificar si hay transacciones asociadas
        const hasTransactions = await transactionRepository.hasTransactionsInCategory(categoryId);
        if (hasTransactions) {
            const error = new Error('No se puede eliminar la categoría porque tiene movimientos asociados.');
            error.status = 400;
            throw error;
        }

        // 2. Eliminar la categoría
        const deleted = await categoryRepository.deleteCategory(categoryId, userId);

        if (!deleted) {
            const notFoundError = new Error('Categoría no encontrada o no pertenece al usuario.');
            notFoundError.status = 404;
            throw notFoundError;
        }

        return { message: 'Categoría eliminada exitosamente.' };

    } catch (error) {
        console.error('Error en remove category Service:', error);
        throw new Error(error.message || 'Error al eliminar la categoría.');
    }
};