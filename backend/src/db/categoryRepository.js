// src/db/categoryRepository.js

const { pool } = require('../config/dbConfig');

/**
 * Crea una nueva categoría para un usuario.
 */
exports.createCategory = async (user_id, name, type) => {
    try {
        const result = await pool.query(
            'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id, name, type',
            [user_id, name, type]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error en createCategory:', error);
        throw new Error('Database error during category creation.');
    }
};

/**
 * Obtiene todas las categorías de un usuario.
 */
exports.getUsersCategories = async (user_id) => {
    try {
        const result = await pool.query(
            'SELECT id, name, type FROM categories WHERE user_id = $1 ORDER BY name',
            [user_id]
        );
        return result.rows;
    } catch (error) {
        console.error('Error en getUsersCategories:', error);
        throw new Error('Database error getting user categories.');
    }
};

/**
 * Cuenta cuántas transacciones están asociadas a una categoría.
 * Es crucial para la lógica de negocio (no eliminar si tiene movimientos).
 */
exports.countTransactionsInCategory = async (category_id) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
            [category_id]
        );
        // Retorna el conteo como un número entero
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('Error en countTransactionsInCategory:', error);
        throw new Error('Database error counting transactions.');
    }
};

/**
 * Elimina una categoría por su ID.
 */
exports.deleteCategory = async (category_id, user_id) => {
    try {
        // Aseguramos que el usuario solo pueda eliminar sus propias categorías
        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
            [category_id, user_id]
        );
        return result.rowCount > 0; // True si se eliminó algo
    } catch (error) {
        console.error('Error en deleteCategory:', error);
        throw new Error('Database error during category deletion.');
    }
};
