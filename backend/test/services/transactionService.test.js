import { describe, expect, jest, test, beforeEach } from "@jest/globals";

// --- 1️⃣ Mock de los repositorios ---
await jest.unstable_mockModule("../../src/db/transactionRepository.js", () => ({
  createTransaction: jest.fn(),
  findTransactionsByUserId: jest.fn(),
  getFinancialSummary: jest.fn(),
  deleteTransaction: jest.fn(),
  getExpensesByCategory: jest.fn(),
}));

await jest.unstable_mockModule("../../src/db/categoryRepository.js", () => ({
  findCategoriesByUserId: jest.fn(),
}));

// --- 2️⃣ Importar los módulos con mocks ---
const transactionRepo = await import("../../src/db/transactionRepository.js");
const categoryRepo = await import("../../src/db/categoryRepository.js");
const transactionService = await import(
  "../../src/services/transactionService.js"
);

describe("transactionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- createTransaction ----------
  test("Debe crear una transaccion correctamente", async () => {
    categoryRepo.findCategoriesByUserId.mockResolvedValue([
      { id: 1, type: "income" },
    ]);
    transactionRepo.createTransaction.mockResolvedValue({ id: 10, userId: 1 });
    const result = await transactionService.createTransaction(
      1,
      1,
      "desc",
      100,
      "2025-10-20"
    );

    expect(result).toHaveProperty("id", 10);
    expect(categoryRepo.findCategoriesByUserId).toHaveBeenCalledWith(1);
    expect(transactionRepo.createTransaction).toHaveBeenCalledWith(1,1,"desc",100,"income","2025-10-20");
  });

  test("Debe lanzar un error si falta algun campo", async () => {
    await expect(transactionService.createTransaction(1,null,"desc",100,"income","2025-10-20"))
      .rejects.toThrow("Todos los campos son obligatorios");
  });

  test("Debe lanzar un error si la categoria no pertenece al usuario", async () => {
    categoryRepo.findCategoriesByUserId.mockResolvedValue([
      { id: 2, type: "income" },
    ]);
    await expect(
      transactionService.createTransaction(1, 1, "desc", 100, "2025-10-20")
    ).rejects.toThrow("Categoría no encontrada o no pertenece al usuario");
  });

  test("Debe lanzar error 500 si repositorio falla", async () => {
    categoryRepo.findCategoriesByUserId.mockRejectedValue(new Error("DB fail"));
    await expect(
      transactionService.createTransaction(1, 1, "desc", 100, "2025-10-20")
    ).rejects.toThrow("Error al crear la transacción");
  });

  // ---------- GetTransacciones ----------
  test("Debe de retornar lass transacciones de un usuario", async () => {
    transactionRepo.findTransactionsByUserId.mockResolvedValue([
      { id: 1, type: "income" },
    ]);
    const result = await transactionService.getTransactions(1);

    expect(result).toHaveLength(1);
  });
  
  test("Debe lanzar un error si el usuario no existe", async () => {
    await expect(transactionService.getTransactions(null)).rejects.toThrow("ID de usuario requerido");
  });

  test('Debe lanzar error 500 si el repositorio falla', async()=>{
    transactionRepo.findTransactionsByUserId.mockRejectedValue(new Error("DB fail"));
    await expect(transactionService.getTransactions(1)).rejects.toThrow('No se pudieron recuperar las transacciones')
    
  })
// ---------- GetDashboard-----------

test('debe de retornar correctamente el dashboard', async()=>{
  transactionRepo.getFinancialSummary.mockResolvedValue({total:500});
  const result =await transactionService.getDashboardData(1, "2025-10-01", "2025-10-20");
  expect(result).toEqual({total:500});
})

test('Debe lanzar error si userId no existe',async()=>{
  await expect(transactionService.getDashboardData(null)).rejects.toThrow('ID de usuario requerido');

})
test ('Debe lanzar error si la base de datos falla', async () =>{
  transactionRepo.getFinancialSummary.mockRejectedValue (new Error('Db fail'));
  await expect(transactionService.getDashboardData(1)).rejects.toThrow('Error al obtener datos del dashboard');
})
// ----------- deleteTransactionService -----------
test('Debe eliminar una transaccion correctamente', async ()=>{
  transactionRepo.deleteTransaction.mockResolvedValue(true);
  const result = await transactionService.deleteTransactionService(1,1);
  expect (result).toEqual({message: 'Transacción eliminada exitosamente'} );
})

test('Debe lanzar un error si faltan id ', async()=>{
  await expect(transactionService.deleteTransactionService(null)).rejects.toThrow('IDs requeridos');
})
test ('debe lanzar error si la transaccion no existe', async()=>{
  transactionRepo.deleteTransaction.mockResolvedValue(false)
  await expect(transactionService.deleteTransactionService(1,1)).rejects.toThrow('Transacción no encontrada o no pertenece al usuario');
})
test('Debe lanzar error si la base de datos falla', async()=>{
  transactionRepo.deleteTransaction.mockRejectedValue(new Error('Db fail'));
  await expect(transactionService.deleteTransactionService(1,1)).rejects.toThrow('Error al eliminar la transacción');
})

  // ---------- getAnalysis ----------
    const mockMovements = [
    { id: 1, date: "2025-10-20", amount: 100 },
    { id: 2, date: "2025-09-20", amount: 50 },
  ];
  const mockCategories = [{ categoryId: 1, total: 150 }];

  test("debe traer correctamente el analisis all", async()=>{
    transactionRepo.findTransactionsByUserId.mockResolvedValue(mockMovements);
    transactionRepo.getExpensesByCategory.mockResolvedValue(mockCategories);

    const result = await transactionService.getAnalysis(1,'all');

    expect(result.movements).toEqual(mockMovements);
    expect(result.categories).toEqual(mockCategories);
  })
  test("Debe retornar análisis financiero rango 'month'", async () => {
    const now = new Date();
    const monthMovements = [
      { id: 1, date: now.toISOString().split("T")[0], amount: 100 },
      { id: 2, date: "2025-01-01", amount: 50 },
    ];
    transactionRepo.findTransactionsByUserId.mockResolvedValue(monthMovements);
    transactionRepo.getExpensesByCategory.mockResolvedValue(mockCategories);

    const result = await transactionService.getAnalysis(1, "month");
    expect(result.movements).toHaveLength(1);
  });

  test("Debe retornar análisis financiero rango 'year'", async () => {
    const now = new Date();
    const yearMovements = [
      { id: 1, date: now.toISOString().split("T")[0], amount: 100 },
      { id: 2, date: "2024-12-31", amount: 50 },
    ];
    transactionRepo.findTransactionsByUserId.mockResolvedValue(yearMovements);
    transactionRepo.getExpensesByCategory.mockResolvedValue(mockCategories);

    const result = await transactionService.getAnalysis(1, "year");
    expect(result.movements).toHaveLength(1);
  });

  test("Debe lanzar error si userId no existe en getAnalysis", async () => {
    await expect(transactionService.getAnalysis(null)).rejects.toThrow("ID de usuario requerido");
  });

  test("Debe lanzar error 500 si alguna función de repositorio falla en getAnalysis", async () => {
    transactionRepo.findTransactionsByUserId.mockRejectedValue(new Error("DB fail"));
    await expect(transactionService.getAnalysis(1)).rejects.toThrow("Error al obtener análisis");
  });
});
