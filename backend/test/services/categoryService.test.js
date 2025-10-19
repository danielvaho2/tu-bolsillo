import { jest } from '@jest/globals';

// --- 1️⃣ Mock del repositorio antes de importar el servicio ---
await jest.unstable_mockModule('../../src/db/categoryRepository.js', () => ({
  findCategoriesByUserId: jest.fn(),
  hasTransactionsInCategory: jest.fn(),
  crearCategoria: jest.fn(),
  obtenerCategorias: jest.fn(),
  deleteCategory: jest.fn(),
  findById: jest.fn(),
}));

// --- 2️⃣ Importar módulos ya con el mock aplicado ---
const categoryRepository = await import('../../src/db/categoryRepository.js');
const categoryService = await import('../../src/services/categoryService.js');

// --- 3️⃣ Tests ---
describe("categoryService", () => {
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("get() devuelve categorías del usuario", async () => {
    categoryRepository.findCategoriesByUserId.mockResolvedValue([
      { id: 1, name: "Sueldo", type: "income" },
    ]);

    const result = await categoryService.get(userId);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Sueldo");
  });

  test("create() lanza error si falta tipo", async () => {
    await expect(
      categoryService.create(userId, "Sueldo", null)
    ).rejects.toThrow("Todos los campos son obligatorios");
  });

  test("remove() lanza error si tiene transacciones", async () => {
    categoryRepository.findById.mockResolvedValue({ id: 1, name: "Sueldo" }); // 👈 simulamos que existe
    categoryRepository.hasTransactionsInCategory.mockResolvedValue(true);

    await expect(categoryService.remove(1, userId)).rejects.toThrow(
      "No se puede eliminar la categoría porque tiene transacciones asociadas"
    );
  });
});
