// backend/test/controllers/authController.test.js
import { jest } from '@jest/globals';

// 👇 Usamos unstable_mockModule porque trabajamos con ES Modules
await jest.unstable_mockModule('../../src/services/authService.js', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

// 👇 Importamos después del mock
const { register, login } = await import('../../src/controllers/authController.js');
const authService = await import('../../src/services/authService.js');

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // 🧠 Test: Falta de campos en registro
  test('register devuelve error 400 si faltan campos', async () => {
    req.body = { email: 'test@example.com' }; // falta name y password

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Faltan campos requeridos: nombre, email y contraseña',
    });
  });

  // 🧠 Test: Contraseña corta
  test('register devuelve error 400 si la contraseña es muy corta', async () => {
    req.body = { name: 'Juan', email: 'juan@example.com', password: '123' };

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'La contraseña debe tener al menos 6 caracteres',
    });
  });

  // ✅ Test: Registro exitoso
  test('register devuelve 201 si el registro es exitoso', async () => {
    req.body = { name: 'Juan', email: 'juan@example.com', password: '123456' };

    authService.register.mockResolvedValue({
      user: { id: 1, name: 'Juan', email: 'juan@example.com' },
      token: 'fake-token',
    });

    await register(req, res);

    expect(authService.register).toHaveBeenCalledWith('Juan', 'juan@example.com', '123456');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      userId: 1,
      name: 'Juan',
      email: 'juan@example.com',
    });
  });

  // ❌ Test: Error del servicio al registrar
  test('register maneja error del servicio', async () => {
    req.body = { name: 'Juan', email: 'juan@example.com', password: '123456' };

    const error = new Error('El usuario ya existe');
    error.status = 409;
    authService.register.mockRejectedValue(error);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El usuario ya existe' });
  });

  // ✅ Test: Login exitoso
  test('login devuelve 200 si las credenciales son válidas', async () => {
    req.body = { email: 'juan@example.com', password: '123456' };

    authService.login.mockResolvedValue({
      user: { id: 1, name: 'Juan', email: 'juan@example.com' },
      token: 'fake-token',
    });

    await login(req, res);

    expect(authService.login).toHaveBeenCalledWith('juan@example.com', '123456');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      userId: 1,
      name: 'Juan',
      email: 'juan@example.com',
    });
  });

  // ❌ Test: Login con error
  test('login maneja error del servicio', async () => {
    req.body = { email: 'juan@example.com', password: '123456' };

    const error = new Error('Credenciales inválidas');
    error.status = 401;
    authService.login.mockRejectedValue(error);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
  });
});
