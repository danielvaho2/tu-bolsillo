import * as categoryService from '../../src/services/categoryService.js';
import * as categoryRepository from '../../src/db/categoryRepository.js';

jest.mock('../../src/db/categoryRepository.js');

describe('categoryService', () => {
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('get() devuelve categorías del usuario', async () => {
    categoryRepository.findCategoriesByUserId.mockResolvedValue([
      { id: 1, name: 'Sueldo', type: 'income' }
    ]);

    const result = await categoryService.get(userId);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sueldo');
  });

  test('create() lanza error si falta tipo', async () => {
    await expect(categoryService.create(userId, 'Sueldo', null))
      .rejects.toThrow('Todos los campos son obligatorios');
  });

  test('remove() lanza error si tiene transacciones', async () => {
    categoryRepository.hasTransactionsInCategory.mockResolvedValue(true);

    await expect(categoryService.remove(1, userId))
      .rejects.toThrow('No se puede eliminar la categoría porque tiene transacciones asociadas');
  });
});
