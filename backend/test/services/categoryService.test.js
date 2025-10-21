import { expect, jest, test } from '@jest/globals';

// --- 1️⃣ Mock del repositorio antes de importar el servicio ---
await jest.unstable_mockModule('../../src/db/categoryRepository.js', () => ({
  findCategoriesByUserId: jest.fn(),
  hasTransactionsInCategory: jest.fn(),
  createCategory: jest.fn(),
  deleteCategory: jest.fn(),
  findById: jest.fn(),
}));

// --- 2️⃣ Importar módulos ya con el mock aplicado ---
const categoryRepository = await import('../../src/db/categoryRepository.js');
const categoryService = await import('../../src/services/categoryService.js');

// --- 3️⃣ Tests ---
describe("categoryService", () => {


  beforeEach(() => {
    jest.clearAllMocks();
  });
//-------Create-------
 
test('crea una categoría correctamente', async () => {
  const mockCategory = { id: 1, name: 'Sueldo', type: 'income', userId: 10 };
  categoryRepository.createCategory.mockResolvedValue(mockCategory);
  const result = await categoryService.create(10, 'Sueldo', 'income');
  expect(result).toEqual(mockCategory);
  expect(categoryRepository.createCategory).toHaveBeenCalledWith(10, 'Sueldo', 'income');
});

 test("Debe lanzar un error si falta algun campo", async () => {
 await expect(categoryService.create(1, 'sueldo', null))
  .rejects.toThrow('Todos los campos son obligatorios');
  });

  test('Debe lanzar un error si el tipo de categoria es invalido',async()=>{
     await expect(categoryService.create(1,'sueldo','Otra'))
 .rejects.toThrow('Tipo de categoría inválido')
  })
test('Debe lanzar error si la base de datos falla', async()=>{
  categoryRepository.createCategory.mockRejectedValue(new Error("DB fail"));
  await expect(categoryService.create(10,'sueldo','income'))
 .rejects.toThrow('Error al crear categoría')
})
//-------Remove-------

  test('Elimina correctamente la categoría', async () => {
    categoryRepository.hasTransactionsInCategory.mockResolvedValue(false);
    categoryRepository.deleteCategory.mockResolvedValue(true);
    const result = await categoryService.remove(5, 1);
    expect(result).toEqual({ message: 'Categoría eliminada exitosamente' });
    expect(categoryRepository.hasTransactionsInCategory).toHaveBeenCalledWith(5);
    expect(categoryRepository.deleteCategory).toHaveBeenCalledWith(5, 1);
  });

  test('Debe lanzar error IDs requeridos', async()=>{
await expect(categoryService.remove(null))
.rejects.toThrow('IDs requeridos');
})
test('Debe lanzar error si tiene transacciones asociadas', async()=>{
   categoryRepository.hasTransactionsInCategory.mockResolvedValue(true);
    await expect(categoryService.remove(5,1))
.rejects.toThrow('No se puede eliminar la categoría porque tiene transacciones asociadas');
  });

   test('Lanza error si la categoría no existe', async () => {
    categoryRepository.hasTransactionsInCategory.mockResolvedValue(false);
    categoryRepository.deleteCategory.mockResolvedValue(false);
    await expect(categoryService.remove(5, 1))
      .rejects.toThrow('Categoría no encontrada');
    expect(categoryRepository.deleteCategory).toHaveBeenCalledWith(5, 1);
  });

  test('Lanza error genérico si el repositorio falla inesperadamente', async () => {
    categoryRepository.hasTransactionsInCategory.mockRejectedValue(new Error('DB fail'));
    await expect(categoryService.remove(5, 1))
      .rejects.toThrow('Error al eliminar categoría');
  });
});
