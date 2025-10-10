import * as categoryRepository from '../db/categoryRepository.js';
import { pool } from '../config/db.config.js';

/**
 * Obtiene todas las categorías de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} Lista de categorías
 */
export const get = async (userId) => {
  if (!userId) {
    const error = new Error('ID de usuario requerido');
    error.status = 400;
    throw error;
  }

  try {
    return await categoryRepository.findCategoriesByUserId(userId);
  } catch (error) {
    console.error('Error en get categories:', error);
    const serviceError = new Error('Error al obtener categorías');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Obtiene todas las categorías con sus montos agregados
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} Lista de categorías con amount
 */
export const getCategoriesWithTotals = async (userId) => {
  if (!userId) {
    const error = new Error('ID de usuario requerido');
    error.status = 400;
    throw error;
  }

  try {
    const query = `
      SELECT
        c.id,
        c.name,
        c.type,
        COALESCE(SUM(t.amount), 0) AS total
      FROM categories c
      LEFT JOIN transactions t
        ON t.category_id = c.id AND t.user_id = $1
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.type
      ORDER BY c.name
    `;
    const result = await pool.query(query, [userId]);

    return result.rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      amount: Number(r.total || 0)
    }));
  } catch (error) {
    console.error('Error en getCategoriesWithTotals:', error);
    const serviceError = new Error('Error al obtener categorías con totales');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Crea una nueva categoría
 * @param {number} userId - ID del usuario
 * @param {string} name - Nombre de la categoría
 * @param {string} type - Tipo ('income' o 'expense')
 * @returns {Promise<Object>} Categoría creada
 */
export const create = async (userId, name, type) => {
  if (!userId || !name || !type) {
    const error = new Error('Todos los campos son obligatorios');
    error.status = 400;
    throw error;
  }

  if (!['income', 'expense'].includes(type)) {
    const error = new Error('Tipo de categoría inválido');
    error.status = 400;
    throw error;
  }

  try {
    return await categoryRepository.createCategory(userId, name, type);
  } catch (error) {
    console.error('Error en create category:', error);
    if (error.status) throw error;

    const serviceError = new Error('Error al crear categoría');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Elimina una categoría
 * @param {number} categoryId - ID de la categoría
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export const remove = async (categoryId, userId) => {
  if (!categoryId || !userId) {
    const error = new Error('IDs requeridos');
    error.status = 400;
    throw error;
  }

  try {
    const hasTransactions = await categoryRepository.hasTransactionsInCategory(categoryId);

    if (hasTransactions) {
      const error = new Error('No se puede eliminar la categoría porque tiene transacciones asociadas');
      error.status = 400;
      throw error;
    }

    const deleted = await categoryRepository.deleteCategory(categoryId, userId);

    if (!deleted) {
      const error = new Error('Categoría no encontrada');
      error.status = 404;
      throw error;
    }

    return { message: 'Categoría eliminada exitosamente' };
  } catch (error) {
    console.error('Error en remove category:', error);
    if (error.status) throw error;

    const serviceError = new Error('Error al eliminar categoría');
    serviceError.status = 500;
    throw serviceError;
  }
};
