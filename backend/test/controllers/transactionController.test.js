import { jest, expect, beforeEach, describe, test } from '@jest/globals';

// --- Mock de los servicios ---
await jest.unstable_mockModule('../../src/services/transactionService.js', () => ({
  getDashboardData: jest.fn(),
  getAnalysis: jest.fn(),
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  deleteTransactionService: jest.fn(),
}));

await jest.unstable_mockModule('../../src/services/categoryService.js', () => ({
  get: jest.fn(),
}));

// --- Importar después de los mocks ---
const transactionService = await import('../../src/services/transactionService.js');
const categoryService = await import('../../src/services/categoryService.js');
const controller = await import('../../src/controllers/transactionController.js');

// --- Mock response helper ---
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// --- Tests ---
describe('transactionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  //getDashboard
  test('getDashboard devuelve datos correctamente', async () => {
    const req = { params: { userId: '10' } };
    const res = mockRes();

    transactionService.getDashboardData.mockResolvedValue({
      balance: 1000, totalIncome: 2000, totalExpenses: 1000, recentTransactions: []
    });
    categoryService.get.mockResolvedValue([{ id: 1, name: 'Comida' }]);

    await controller.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      financialData: expect.any(Object),
      categories: [{ id: 1, name: 'Comida' }]
    });
  });

  test('getDashboard error si ID inválido', async () => {
    const req = { params: { userId: 'abc' } };
    const res = mockRes();

    await controller.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('getDashboard captura error del servicio', async () => {
    const req = { params: { userId: '10' } };
    const res = mockRes();

    transactionService.getDashboardData.mockRejectedValue(new Error('falló dashboard'));

    await controller.getDashboard(req, res);

    expect(console.error).toHaveBeenCalledWith('Error al obtener dashboard:', 'falló dashboard');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'falló dashboard' });
  });

  // getAnalysis
  test('getAnalysis devuelve análisis correctamente', async () => {
    const req = { params: { userId: '5' }, query: { range: 'all' } };
    const res = mockRes();

    transactionService.getAnalysis.mockResolvedValue({
      movements: [], categories: []
    });

    await controller.getAnalysis(req, res);

    expect(console.log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ movements: [], categories: [] });
  });

  test('getAnalysis error si ID inválido', async () => {
    const req = {params: { userId: 'abc' },query: {}} 

    const res = mockRes();

    await controller.getAnalysis(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('getAnalysis captura error del servicio', async () => {
    const req = { params: { userId: '5' }, query: {} };
    const res = mockRes();

    transactionService.getAnalysis.mockRejectedValue(new Error('error análisis'));

    await controller.getAnalysis(req, res);

    expect(console.error).toHaveBeenCalledWith('Error al obtener análisis:', 'error análisis');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error análisis' });
  });

  // createMovement
  test('createMovement crea movimiento correctamente', async () => {
    const req = {
      body: { userId: 1, description: 'Compra', amount: 100, categoryId: 2, date: '2025-10-22' }
    };
    const res = mockRes();

    const mockMovement = { id: 1, description: 'Compra' };
    transactionService.createTransaction.mockResolvedValue(mockMovement);

    await controller.createMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Movimiento registrado exitosamente',
      movement: mockMovement
    });
  });

  test('createMovement error si faltan campos', async () => {
    const req = { body: { userId: 1, description: '', amount: 0 } };
    const res = mockRes();

    await controller.createMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Todos los campos son obligatorios' });
  });

  test('createMovement error si monto <= 0', async () => {
    const req = { body: { userId: 1, description: 'Prueba', amount: -5, categoryId: 2, date: '2025-10-22' } };
    const res = mockRes();

    await controller.createMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El monto debe ser mayor a 0' });
  });

  test('createMovement captura error del servicio', async () => {
    const req = {
      body: { userId: 1, description: 'Compra', amount: 50, categoryId: 2, date: '2025-10-22' }
    };
    const res = mockRes();

    transactionService.createTransaction.mockRejectedValue(new Error('error al crear movimiento'));
    await controller.createMovement(req, res);

    expect(console.error).toHaveBeenCalledWith('Error al crear movimiento:', 'error al crear movimiento');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error al crear movimiento' });
  });

  // getMovements
  test('getMovements devuelve movimientos correctamente', async () => {
    const req = { params: { userId: '3' } };
    const res = mockRes();
    const mockMovements = [{ id: 1, description: 'Pago' }];

    transactionService.getTransactions.mockResolvedValue(mockMovements);

    await controller.getMovements(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ movements: mockMovements });
  });

  test('getMovements error si ID inválido', async () => {
    const req = { params: { userId: 'abc' } };
    const res = mockRes();

    await controller.getMovements(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('getMovements captura error del servicio', async () => {
    const req = { params: { userId: '3' } };
    const res = mockRes();

    transactionService.getTransactions.mockRejectedValue(new Error('error al obtener movimientos'));

    await controller.getMovements(req, res);

    expect(console.error).toHaveBeenCalledWith('Error al obtener movimientos:', 'error al obtener movimientos');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error al obtener movimientos' });
  });

  // deleteMovement
  test('deleteMovement elimina correctamente', async () => {
    const req = { params: { movementId: '4' }, body: { userId: 1 } };
    const res = mockRes();

    transactionService.deleteTransactionService.mockResolvedValue({ message: 'Eliminado' });

    await controller.deleteMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Eliminado' });
  });

  test('deleteMovement error si movementId inválido', async () => {
    const req = { params: { movementId: 'abc' }, body: { userId: 1 } };
    const res = mockRes();

    await controller.deleteMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de movimiento inválido' });
  });

  test('deleteMovement error si userId inválido', async () => {
    const req = { params: { movementId: '1' }, body: { userId: 'abc' } };
    const res = mockRes();

    await controller.deleteMovement(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('deleteMovement captura error del servicio', async () => {
    const req = { params: { movementId: '1' }, body: { userId: 1 } };
    const res = mockRes();

    transactionService.deleteTransactionService.mockRejectedValue(new Error('falló al eliminar'));
    await controller.deleteMovement(req, res);

    expect(console.error).toHaveBeenCalledWith('Error al eliminar movimiento:', 'falló al eliminar');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'falló al eliminar' });
  });
});
