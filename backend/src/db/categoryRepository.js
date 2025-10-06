import { pool } from '../config/db.config.js'; // Importación ES Module con extensión .js

// ---------------------------------------------
// REPOSITORIO DE CATEGORÍAS
// ---------------------------------------------

/**
 * Busca todas las categorías de un usuario.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} Lista de categorías.
 */
export const findCategoriesByUserId = async (userId) => {
    const query = 'SELECT id, user_id AS "userId", name, type FROM categories WHERE user_id = $1 ORDER BY name ASC';
    try {
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error en findCategoriesByUserId:', error);
        throw new Error('Error de base de datos al buscar categorías.');
    }
};

/**
 * Crea una nueva categoría.
 * @param {number} userId - ID del usuario.
 * @param {string} name - Nombre de la categoría.
 * @param {('income'|'expense')} type - Tipo de categoría.
 * @returns {Promise<Object>} El objeto de la nueva categoría.
 */
export const createCategory = async (userId, name, type) => {
    const query = `
        INSERT INTO categories (user_id, name, type)
        VALUES ($1, $2, $3)
        RETURNING id, user_id AS "userId", name, type;
    `;
    try {
        const result = await pool.query(query, [userId, name, type]);
        return result.rows[0];
    } catch (error) {
        // Manejo de error de clave única (si el usuario ya tiene una categoría con ese nombre)
        if (error.code === '23505') {
            const uniqueError = new Error('Ya existe una categoría con ese nombre para este usuario.');
            uniqueError.status = 400; // Agregar un status para mejor manejo en el service
            throw uniqueError;
        }
        console.error('Error en createCategory:', error);
        throw new Error('Error de base de datos al crear categoría.');
    }
};

/**
 * Elimina una categoría por ID.
 * Nota: Si esta categoría tiene transacciones asociadas, PostgreSQL impedirá la eliminación 
 * debido a la restricción 'ON DELETE RESTRICT' que definimos en db.config.js.
 * @param {number} categoryId - ID de la categoría.
 * @param {number} userId - ID del usuario para verificar la propiedad.
 * @returns {Promise<boolean>} True si se eliminó, False si no se encontró o no se pudo eliminar.
 */
export const deleteCategory = async (categoryId, userId) => {
    const query = 'DELETE FROM categories WHERE id = $1 AND user_id = $2';
    try {
        const result = await pool.query(query, [categoryId, userId]);
        return result.rowCount > 0;
    } catch (error) {
        // Error 23503: Violación de Foreign Key (transacciones aún existen)
        if (error.code === '23503') {
            const foreignKeyError = new Error('No se puede eliminar la categoría porque tiene transacciones asociadas.');
            foreignKeyError.status = 400; // Agregar un status para mejor manejo en el service
            throw foreignKeyError;
        }
        console.error('Error en deleteCategory:', error);
        throw new Error('Error de base de datos al intentar eliminar categoría.');
    }
};

/**
 * Función auxiliar para verificar si una categoría tiene transacciones.
 * Esta es necesaria para el categoryService, que debe verificar esto ANTES de intentar borrar.
 * @param {number} categoryId - ID de la categoría.
 * @returns {Promise<boolean>} True si hay transacciones, False si no.
 */
export const hasTransactionsInCategory = async (categoryId) => {
    const query = 'SELECT 1 FROM transactions WHERE category_id = $1 LIMIT 1';
    try {
        const result = await pool.query(query, [categoryId]);
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error en hasTransactionsInCategory:', error);
        throw new Error('Error de base de datos al verificar transacciones.');
    }
};

// [Nota]: Se eliminó la línea 'module.exports' y se usó 'export const' en cada función.