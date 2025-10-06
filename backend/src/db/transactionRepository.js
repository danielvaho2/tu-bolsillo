// backend/src/db/transactionRepository.js
import { pool } from '../config/db.config.js';

/**
 * Obtiene el resumen financiero del usuario
 * @param {number} userId - ID del usuario
 * @param {string|null} startDate - Fecha de inicio (opcional)
 * @param {string|null} endDate - Fecha de fin (opcional)
 * @returns {Promise<Object>} Resumen financiero
 */
export const getFinancialSummary = async (userId, startDate = null, endDate = null) => {
  const client = await pool.connect();
  try {
    let summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses
      FROM transactions t
      WHERE t.user_id = $1
    `;
    
    let recentTransactionsQuery = `
      SELECT 
        t.id,
        t.amount,
        t.type,
        t.category_id,
        t.description,
        t.date,
        t.created_at,
        c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;

    const queryParams = [userId];
    let paramCounter = 2;

    if (startDate) {
      summaryQuery += ` AND t.date >= $${paramCounter}`;
      recentTransactionsQuery += ` AND t.date >= $${paramCounter}`;
      queryParams.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      summaryQuery += ` AND t.date <= $${paramCounter}`;
      recentTransactionsQuery += ` AND t.date <= $${paramCounter}`;
      queryParams.push(endDate);
    }

    recentTransactionsQuery += ` ORDER BY t.date DESC, t.created_at DESC LIMIT 10`;

    const [summaryResult, transactionsResult] = await Promise.all([
      client.query(summaryQuery, queryParams),
      client.query(recentTransactionsQuery, queryParams)
    ]);

    const summary = summaryResult.rows[0];
    const balance = parseFloat(summary.total_income) - parseFloat(summary.total_expenses);

    return {
      totalIncome: parseFloat(summary.total_income),
      totalExpenses: parseFloat(summary.total_expenses),
      balance: balance,
      recentTransactions: transactionsResult.rows.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        type: t.type,
        categoryId: t.category_id,
        categoryName: t.category_name,
        description: t.description,
        date: t.date,
        createdAt: t.created_at
      }))
    };
  } catch (error) {
    console.error('Error en getFinancialSummary:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Crea una nueva transacción
 * @param {number} userId - ID del usuario
 * @param {number} categoryId - ID de la categoría
 * @param {string} description - Descripción
 * @param {number} amount - Monto
 * @param {string} type - Tipo ('income' o 'expense')
 * @param {string} date - Fecha
 * @returns {Promise<Object>} Transacción creada
 */
export const createTransaction = async (userId, categoryId, description, amount, type, date) => {
  const query = `
    INSERT INTO transactions (user_id, category_id, description, amount, type, date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, category_id, description, amount, type, date, created_at
  `;

  try {
    const result = await pool.query(query, [userId, categoryId, description, amount, type, date]);
    return result.rows[0];
  } catch (error) {
    console.error('Error en createTransaction:', error);
    throw error;
  }
};

/**
 * Obtiene todas las transacciones de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} Lista de transacciones
 */
export const findTransactionsByUserId = async (userId) => {
  const query = `
    SELECT 
      t.id,
      t.user_id,
      t.category_id,
      t.description,
      t.amount,
      t.type,
      t.date,
      t.created_at,
      c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1
    ORDER BY t.date DESC, t.created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error en findTransactionsByUserId:', error);
    throw error;
  }
};

/**
 * Elimina una transacción
 * @param {number} transactionId - ID de la transacción
 * @param {number} userId - ID del usuario
 * @returns {Promise<boolean>} true si se eliminó
 */
export const deleteTransaction = async (transactionId, userId) => {
  const query = `
    DELETE FROM transactions
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [transactionId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error en deleteTransaction:', error);
    throw error;
  }
};

/**
 * Obtiene gastos por categoría
 * @param {number} userId - ID del usuario
 * @param {string|null} startDate - Fecha de inicio
 * @param {string|null} endDate - Fecha de fin
 * @returns {Promise<Array>} Gastos por categoría
 */
export const getExpensesByCategory = async (userId, startDate = null, endDate = null) => {
  let query = `
    SELECT 
      c.id as category_id,
      c.name as category_name,
      SUM(t.amount) as total,
      COUNT(t.id) as count
    FROM transactions t
    INNER JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1 AND t.type = 'expense'
  `;
  
  const queryParams = [userId];
  let paramCounter = 2;

  if (startDate) {
    query += ` AND t.date >= $${paramCounter}`;
    queryParams.push(startDate);
    paramCounter++;
  }

  if (endDate) {
    query += ` AND t.date <= $${paramCounter}`;
    queryParams.push(endDate);
    paramCounter++;
  }

  query += ` GROUP BY c.id, c.name ORDER BY total DESC`;

  try {
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error en getExpensesByCategory:', error);
    throw error;
  }
};

export default {
  getFinancialSummary,
  createTransaction,
  findTransactionsByUserId,
  deleteTransaction,
  getExpensesByCategory
};