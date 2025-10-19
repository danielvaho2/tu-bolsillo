import { describe, expect, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// --- 1️⃣ Mock del repositorio antes de importar el servicio ---
await jest.unstable_mockModule("../../src/db/userReporitory.js", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

// --- 2️⃣ Importar módulos ya con el mock aplicado ---
const userRepo = await import("../../src/db/userReporitory.js");
const authService = await import("../../src/services/authService.js");

// --- 3️⃣ Tests ---

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  //-------------registrar-------------
  test("Debe registrar un usuario nuevo correctamente", async () => {
    userRepo.findUserByEmail.mockResolvedValue(null);
    userRepo.createUser.mockResolvedValue({
      id: 1,
      name: "test",
      email: "test@prueba.com",
    });

    const mockHash = jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed123");
    const result = await authService.register(
      "test",
      "test@prueba.com",
      "123456"
    );
    expect(userRepo.findUserByEmail).toHaveBeenCalledWith("test@prueba.com");
    expect(userRepo.createUser).toHaveBeenCalledWith(
      "test",
      "test@prueba.com",
      "hashed123"
    );
    expect(result.user.email).toBe("test@prueba.com");
    expect(result).toHaveProperty("token");
    mockHash.mockRestore();
  });

  test("Deberia lanzar un error si el usuairo ya existe", async () => {
    userRepo.findUserByEmail.mockResolvedValue({
      id: 1,
      email: "existe@prueba.com",
    });
    //lo que hace es que se espera que devuelva un email con eso y con .rejects salga error y dice lo que puse
    await expect(
      authService.register("test", "existe@prueba.com", "123456")
    ).rejects.toThrow("El usuario con este email ya existe");
  });

  //-------------login-------------
});
