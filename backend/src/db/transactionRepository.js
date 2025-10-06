// backend/src/db/transactionRepository.js
import { pool } from '../config/db.config.js';

/**
 * Obtiene el resumen financiero del usuario
 */
export async function getFinancialSummary(userId) {
  const client = await pool.connect();
  try {
    // Resumen de ingresos y gastos
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses
      FROM transactions t
      WHERE t.user_id = $1
    `;
    
    // Últimas 10 transacciones
    const recentTransactionsQuery = `
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
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `;

    const [summaryResult, transactionsResult] = await Promise.all([
      client.query(summaryQuery, [userId]),
      client.query(recentTransactionsQuery, [userId])
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
}

/**
 * Crea una nueva transacción
 */
export async function createTransaction(userId, transactionData) {
  const { amount, type, categoryId, description, date } = transactionData;
  
  const query = `
    INSERT INTO transactions (user_id, amount, type, category_id, description, date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      userId,
      amount,
      type,
      categoryId,
      description,
      date || new Date()
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error en createTransaction:', error);
    throw error;
  }
}

/**
 * Obtiene todas las transacciones de un usuario
 */
export async function getTransactionsByUser(userId, filters = {}) {
  let query = `
    SELECT 
      t.*,
      c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1
  `;
  
  const queryParams = [userId];
  let paramCounter = 2;

  if (filters.type) {
    query += ` AND t.type = $${paramCounter}`;
    queryParams.push(filters.type);
    paramCounter++;
  }

  if (filters.categoryId) {
    query += ` AND t.category_id = $${paramCounter}`;
    queryParams.push(filters.categoryId);
    paramCounter++;
  }

  if (filters.startDate) {
    query += ` AND t.date >= $${paramCounter}`;
    queryParams.push(filters.startDate);
    paramCounter++;
  }

  if (filters.endDate) {
    query += ` AND t.date <= $${paramCounter}`;
    queryParams.push(filters.endDate);
    paramCounter++;
  }

  query += ` ORDER BY t.date DESC, t.created_at DESC`;

  try {
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error en getTransactionsByUser:', error);
    throw error;
  }
}

/**
 * Obtiene una transacción por ID
 */
export async function getTransactionById(transactionId, userId) {
  const query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = $1 AND t.user_id = $2
  `;

  try {
    const result = await pool.query(query, [transactionId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en getTransactionById:', error);
    throw error;
  }
}

/**
 * Actualiza una transacción
 */
export async function updateTransaction(transactionId, userId, updateData) {
  const { amount, type, categoryId, description, date } = updateData;
  
  const query = `
    UPDATE transactions
    SET 
      amount = COALESCE($1, amount),
      type = COALESCE($2, type),
      category_id = COALESCE($3, category_id),
      description = COALESCE($4, description),
      date = COALESCE($5, date)
    WHERE id = $6 AND user_id = $7
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [
      amount,
      type,
      categoryId,
      description,
      date,
      transactionId,
      userId
    ]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en updateTransaction:', error);
    throw error;
  }
}

/**
 * Elimina una transacción
 */
export async function deleteTransaction(transactionId, userId) {
  const query = `
    DELETE FROM transactions
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [transactionId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en deleteTransaction:', error);
    throw error;
  }
}

/**
 * Obtiene gastos por categoría
 */
export async function getExpensesByCategory(userId, startDate = null, endDate = null) {
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
}

/**
 * Obtiene resumen mensual
 */
export async function getMonthlyFinancialSummary(userId, year) {
  const query = `
    SELECT 
      EXTRACT(MONTH FROM t.date)::INTEGER as month,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses
    FROM transactions t
    WHERE t.user_id = $1 AND EXTRACT(YEAR FROM t.date) = $2
    GROUP BY EXTRACT(MONTH FROM t.date)
    ORDER BY month
  `;

  try {
    const result = await pool.query(query, [userId, year]);
    return result.rows;
  } catch (error) {
    console.error('Error en getMonthlyFinancialSummary:', error);
    throw error;
  }
}

export default {
  getFinancialSummary,
  createTransaction,
  getTransactionsByUser,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getExpensesByCategory,
  getMonthlyFinancialSummary
};