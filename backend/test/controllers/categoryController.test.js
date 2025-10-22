import { jest, expect } from '@jest/globals';

// --- 1️⃣ Mock del servicio antes de importar el controlador ---
await jest.unstable_mockModule('../../src/services/categoryService.js', () => ({
  getCategoriesWithTotals: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
}));

// --- 2️⃣ Importar después de aplicar el mock ---
const categoryService = await import('../../src/services/categoryService.js');
const { getCategories, createCategory, deleteCategory } = await import('../../src/controllers/categoryController.js');

// --- 3️⃣ Mock de response ---
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('categoryController', () => {
  beforeEach(() => jest.clearAllMocks());

  // GET
  test('getCategories devuelve categorías correctamente', async () => {
    const mockReq = { params: { userId: '10' } };
    const res = mockRes();
    const mockData = [{ id: 1, name: 'Sueldo', type: 'income' }];
    categoryService.getCategoriesWithTotals.mockResolvedValue(mockData);

    await getCategories(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ categories: mockData });
  });

  test('getCategories devuelve error si userId inválido', async () => {
    const mockReq = { params: { userId: 'abc' } };
    const res = mockRes();

    await getCategories(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('getCategories captura error del servicio', async () => {
    const mockReq = { params: { userId: '10' } };
    const res = mockRes();

    categoryService.getCategoriesWithTotals.mockRejectedValue(new Error('falló la BD'));
    await getCategories(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'falló la BD' });
  });
  // CREATE
  test('createCategory crea correctamente', async () => {
    const mockReq = { body: { userId: 10, name: 'Comida', type: 'expense' } };
    const res = mockRes();
    const mockCategory = { id: 1, name: 'Comida', type: 'expense', userId: 10 };

    categoryService.create.mockResolvedValue(mockCategory);
    await createCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Categoría creada exitosamente',
      category: mockCategory,
    });
  });

  test('createCategory devuelve error si faltan campos', async () => {
    const mockReq = { body: { userId: 10, name: '', type: '' } };
    const res = mockRes();

    await createCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Todos los campos son obligatorios' });
  });

  test('createCategory devuelve error si tipo inválido', async () => {
    const mockReq = { body: { userId: 10, name: 'Prueba', type: 'otro' } };
    const res = mockRes();

    await createCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tipo de categoría inválido' });
  });

  test('createCategory devuelve error si userId inválido', async () => {
    const mockReq = { body: { userId: 'abc', name: 'Prueba', type: 'income' } };
    const res = mockRes();

    await createCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('createCategory captura error del servicio', async () => {
    const mockReq = { body: { userId: 10, name: 'Comida', type: 'expense' } };
    const res = mockRes();

    categoryService.create.mockRejectedValue(new Error('falló al crear'));
    await createCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'falló al crear' });
  });
  // DELETE
  test('deleteCategory elimina correctamente', async () => {
    const mockReq = { params: { categoryId: '5' }, body: { userId: 10 } };
    const res = mockRes();

    categoryService.remove.mockResolvedValue({ message: 'Categoría eliminada exitosamente' });
    await deleteCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Categoría eliminada exitosamente' });
  });
test('deleteCategory error si ID inválido', async () => {
    const mockReq = { params: { categoryId: 'abc' }, body: { userId: 10 } };
    const res = mockRes();

    await deleteCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de categoría inválido' });
  });

  test('deleteCategory devuelve error si userId inválido', async () => {
    const mockReq = { params: { categoryId: '5' }, body: { userId: 'abc' } };
    const res = mockRes();

    await deleteCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID de usuario inválido' });
  });

  test('deleteCategory captura error del servicio', async () => {
    const mockReq = { params: { categoryId: '5' }, body: { userId: 10 } };
    const res = mockRes();

    categoryService.remove.mockRejectedValue(new Error('error al eliminar'));
    await deleteCategory(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'error al eliminar' });
  });
});