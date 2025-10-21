import { describe, expect, jest, test } from "@jest/globals";
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

 test('debe lanzar error si la db falla', async () => {
 userRepo.findUserByEmail.mockResolvedValue(null);
  userRepo.createUser.mockRejectedValue(new Error('Db fail'));

  await expect(authService.register("tests", "existe@prueba.com", "123456"))
    .rejects
    .toThrow('Error en el servicio de registro');
});

  //-------------login-------------

test("Debe verificar que las credenciales coincidan", async () => {
  const userMock = {
    id: 1,
    name: 'Prueba',
    email: "existe@prueba.com",
    password: 'hashedpassword',
  };
 jest.spyOn(userRepo, 'findUserByEmail').mockResolvedValue(userMock);
 // Simula que la contraseña es correcta
  jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
  // Simula la generación del token
  jest.spyOn(jwt, 'sign').mockReturnValue('Token123');
  // Ejecuta la función
  const result = await authService.login('existe@prueba.com', 'hashedpassword');
  // Verifica el resultado
  expect(result.user.email).toBe("existe@prueba.com");
  expect(result).toHaveProperty('token', 'Token123');
});

  test('debe lanzar error si las credenciales son inválidas', async () => {
    jest.spyOn(userRepo,'findUserByEmail').mockResolvedValue(null);

        await expect(authService.login("NoExite@email.com",'12345'))
      .rejects.toThrow('Credenciales inválidas')
 
  });

  test('Compara las contraseñas para que estas coincidan ', async ()=>{
      userRepo.findUserByEmail({
    id: 1,
    name: 'Prueba',
    email: "existe@prueba.com",
    password: 'hashedpasswordPASS',
  });

jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

await expect(authService.login("existe@prueba.com", 'hashedpasswordWRONG'))
.rejects.toThrow('Credenciales inválidas')
  })


  test('Debe lanzar un error si no hay contraseña hasheada', async () => {
  // Simula que findUserByEmail devuelve un usuario sin contraseña
  jest.spyOn(userRepo, 'findUserByEmail').mockResolvedValue({
    id: 1,
    name: 'Daniel',
    email: 'daniel@test.com',
    password: null,  
  });;

  // Llamada a la función login, esperamos que lance un error
  await expect(authService.login('daniel@test.com', '123456'))
    .rejects.toThrow('Error de configuración de contraseña para el usuario');  // Verificamos el mensaje de error

});
test('debe lanzar error si la db falla', async () => {
  userRepo.findUserByEmail.mockRejectedValue(new Error('Db fail'));

  await expect(authService.login("existe@prueba.com", "123456"))
    .rejects
    .toThrow('Error de autenticación');
});


//-------------Verificar el token-------------

test('debe verificar un token válido', () => {
    const usermock = { userId: 1, email: 'test@test.com' };
    jest.spyOn(jwt, 'verify').mockReturnValue(usermock);

    const result = authService.verifyToken('tokenValido');
    expect(result).toEqual(usermock);
  });
 test('debe retornar null si el token es inválido', () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Token inválido');
    });

    const result = authService.verifyToken('tokenMalo');
    expect(result).toBeNull();
  });
});

