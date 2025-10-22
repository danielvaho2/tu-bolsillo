// backend/src/services/transactionService.js
import * as transactionRepo from '../db/transactionRepository.js';
import * as categoryRepository from '../db/categoryRepository.js';

/**
 * Crea una nueva transacción
 * @param {number} userId - ID del usuario
 * @param {number} categoryId - ID de la categoría
 * @param {string} description - Descripción
 * @param {number} amount - Monto
 * @param {string} date - Fecha
 * @returns {Promise<Object>} Transacción creada
 */
export const createTransaction = async (userId, categoryId, description, amount, date) => {
  if (!userId || !categoryId || !description || !amount || !date) {
    const error = new Error('Todos los campos son obligatorios');
    error.status = 400;
    throw error;
  }

  try {
    // Verificar que la categoría existe y pertenece al usuario
    const categories = await categoryRepository.findCategoriesByUserId(userId);
    const category = categories.find(c => c.id === Number.parseInt(categoryId, 10));

    if (!category) {
      const error = new Error('Categoría no encontrada o no pertenece al usuario');
      error.status = 404;
      throw error;
    }

    const type = category.type;

    return await transactionRepo.createTransaction(
      userId,
      categoryId,
      description,
      amount,
      type,
      date
    );
  } catch (error) {
    console.error('Error en createTransaction Service:', error);
    if (error.status) throw error;
    
    const serviceError = new Error('Error al crear la transacción');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Obtiene todas las transacciones de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} Lista de transacciones
 */
export const getTransactions = async (userId) => {
  if (!userId) {
    const error = new Error('ID de usuario requerido');
    error.status = 400;
    throw error;
  }

  try {
    return await transactionRepo.findTransactionsByUserId(userId);
  } catch (error) {
    console.error('Error en getTransactions Service:', error);
    const serviceError = new Error('No se pudieron recuperar las transacciones');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Obtiene el resumen financiero para el dashboard
 * @param {number} userId - ID del usuario
 * @param {string} startDate - Fecha de inicio (opcional)
 * @param {string} endDate - Fecha de fin (opcional)
 * @returns {Promise<Object>} Resumen financiero
 */
export const getDashboardData = async (userId, startDate = null, endDate = null) => {
  if (!userId) {
    const error = new Error('ID de usuario requerido');
    error.status = 400;
    throw error;
  }

  try {
    return await transactionRepo.getFinancialSummary(userId, startDate, endDate);
  } catch (error) {
    console.error('Error en getDashboardData Service:', error);
    const serviceError = new Error('Error al obtener datos del dashboard');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Elimina una transacción
 * @param {number} transactionId - ID de la transacción
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
export const deleteTransactionService = async (transactionId, userId) => {
  if (!transactionId || !userId) {
    const error = new Error('IDs requeridos');
    error.status = 400;
    throw error;
  }

  try {
    const deleted = await transactionRepo.deleteTransaction(transactionId, userId);
    
    if (!deleted) {
      const notFoundError = new Error('Transacción no encontrada o no pertenece al usuario');
      notFoundError.status = 404;
      throw notFoundError;
    }

    return { message: 'Transacción eliminada exitosamente' };
  } catch (error) {
    console.error('Error en deleteTransaction Service:', error);
    if (error.status) throw error;
    
    const serviceError = new Error('Error al eliminar la transacción');
    serviceError.status = 500;
    throw serviceError;
  }
};

/**
 * Obtiene análisis financiero
 * @param {number} userId - ID del usuario
 * @param {string} range - Rango de tiempo
 * @returns {Promise<Object>} Datos de análisis
 */
export const getAnalysis = async (userId, range = 'all') => {
  if (!userId) {
    const error = new Error('ID de usuario requerido');
    error.status = 400;
    throw error;
  }

  try {
    let startDate = null;
    let endDate = null;

    if (range === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (range === 'year') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    const [movements, categories] = await Promise.all([
      transactionRepo.findTransactionsByUserId(userId),
      transactionRepo.getExpensesByCategory(userId, startDate, endDate)
    ]);

    // Filtrar movements por rango si es necesario
    let filteredMovements = movements;
    if (startDate && endDate) {
      filteredMovements = movements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= new Date(startDate) && mDate <= new Date(endDate);
      });
    }

    return {
      movements: filteredMovements,
      categories: categories
    };
  } catch (error) {
    console.error('Error en getAnalysis Service:', error);
    const serviceError = new Error('Error al obtener análisis');
    serviceError.status = 500;
    throw serviceError;
  }
};