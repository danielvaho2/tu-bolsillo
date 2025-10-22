// backend/src/controllers/transactionController.js
import * as transactionService from '../services/transactionService.js';
import * as categoryService from '../services/categoryService.js';

/**
 * Obtiene datos del dashboard
 * GET /api/dashboard/:userId
 */
export const getDashboard = async (req, res) => {
  const { userId } = req.params;

  if (!userId || Number.isNaN(Number.parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const parsedUserId = Number.parseInt(userId, 10);
    
    // Obtener datos financieros y categorías en paralelo
    const [financialSummary, categories] = await Promise.all([
      transactionService.getDashboardData(parsedUserId),
      categoryService.get(parsedUserId)
    ]);

    // Formatear respuesta según lo que espera el frontend
    return res.status(200).json({
      financialData: {
        balance: financialSummary.balance || 0,
        income: financialSummary.totalIncome || 0,
        expenses: financialSummary.totalExpenses || 0,
        recentTransactions: financialSummary.recentTransactions || []
      },
      categories: categories || []
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al cargar datos del dashboard';
    return res.status(status).json({ error: message });
  }
};

/**
 * Obtiene análisis financiero
 * GET /api/analysis/:userId?range=all
 */
export const getAnalysis = async (req, res) => {
  const { userId } = req.params;
  const { range = 'all' } = req.query;

  if (!userId || Number.isNaN(Number.parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  console.log(`📊 Solicitud de análisis para usuario ${userId}, rango: ${range}`);

  try {
    const data = await transactionService.getAnalysis(Number.parseInt(userId, 10), range);
    console.log(`📈 Análisis enviado: ${data.movements.length} movimientos, ${data.categories.length} categorías`);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener análisis:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al obtener datos de análisis';
    return res.status(status).json({ error: message });
  }
};

/**
 * Crea un nuevo movimiento
 * POST /api/movements
 */
export const createMovement = async (req, res) => {
  const { userId, description, amount, categoryId, date } = req.body;

  if (!userId || !description || !amount || !categoryId || !date) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (Number.parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  try {
    const movement = await transactionService.createTransaction(
      Number.parseInt(userId, 10),
      Number.parseInt(categoryId, 10),
      description,
      Number.parseFloat(amount),
      date
    );

    return res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movement
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al crear movimiento';
    return res.status(status).json({ error: message });
  }
};

/**
 * Obtiene todos los movimientos de un usuario
 * GET /api/movements/:userId
 */
export const getMovements = async (req, res) => {
  const { userId } = req.params;

  if (!userId || Number.isNaN(Number.parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const movements = await transactionService.getTransactions(Number.parseInt(userId, 10));
    return res.status(200).json({ movements });
  } catch (error) {
    console.error('Error al obtener movimientos:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al obtener movimientos';
    return res.status(status).json({ error: message });
  }
};

/**
 * Elimina un movimiento
 * DELETE /api/movements/:movementId
 */
export const deleteMovement = async (req, res) => {
  const { movementId } = req.params;
  const { userId } = req.body;

  if (!movementId || Number.isNaN(Number.parseInt(movementId, 10))) {
    return res.status(400).json({ error: 'ID de movimiento inválido' });
  }

  if (!userId || Number.isNaN(Number.parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const result = await transactionService.deleteTransactionService(
      Number.parseInt(movementId, 10),
      Number.parseInt(userId, 10)
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al eliminar movimiento:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al eliminar movimiento';
    return res.status(status).json({ error: message });
  }
};
