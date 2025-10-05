// src/db/transactionRepository.js

const { pool } = require('../config/dbConfig');

/**
 * Crea una nueva transacción (movimiento).
 */
exports.createTransaction = async (user_id, category_id, description, amount, type, date) => {
    try {
        const result = await pool.query(
            `INSERT INTO transactions (user_id, category_id, description, amount, type, date)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, description, amount, type, date`,
            [user_id, category_id, description, amount, type, date]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error en createTransaction:', error);
        throw new Error('Database error during transaction creation.');
    }
};

/**
 * Obtiene todas las transacciones de un usuario en un rango de fechas.
 */
exports.getTransactionsByDateRange = async (user_id, startDate, endDate) => {
    try {
        const result = await pool.query(
            `SELECT t.id, t.description, t.amount, t.type, t.date, c.name AS category_name
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
             ORDER BY t.date DESC`,
            [user_id, startDate, endDate]
        );
        return result.rows;
    } catch (error) {
        console.error('Error en getTransactionsByDateRange:', error);
        throw new Error('Database error retrieving transactions.');
    }
};

/**
 * Calcula el resumen de ingresos y gastos para el dashboard.
 */
exports.getDashboardSummary = async (user_id) => {
    try {
        const result = await pool.query(
            `SELECT type, SUM(amount) AS total
             FROM transactions
             WHERE user_id = $1 AND date >= date_trunc('month', current_date)
             GROUP BY type`,
            [user_id]
        );
        return result.rows;
    } catch (error) {
        console.error('Error en getDashboardSummary:', error);
        throw new Error('Database error getting dashboard summary.');
    }
};
// Aquí irían también deleteTransaction, updateTransaction, etc., si los tuvieras.