// backend/src/controllers/authController.js
import * as authService from '../services/authService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_fallback';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: nombre, email y contraseña'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    const result = await authService.register(name, email, password);
    const token = generateToken(result.user);

    console.log(`✅ Usuario registrado: ${email}`);

    return res.status(201).json({
      userId: result.user.id,  // ✅ CAMBIADO de 'id' a 'userId'
      name: result.user.name,
      email: result.user.email,
      token: token
    });
  } catch (error) {
    console.error('Error en registro:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor al registrar el usuario';
    return res.status(status).json({ error: message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: email y contraseña'
    });
  }

  try {
    const result = await authService.login(email, password);
    const token = generateToken(result.user);

    console.log(`✅ Login exitoso: ${email}`);

    return res.status(200).json({
      userId: result.user.id,  // ✅ CAMBIADO de 'id' a 'userId'
      name: result.user.name,
      email: result.user.email,
      token: token
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error interno del servidor al iniciar sesión';
    return res.status(status).json({ error: message });
  }
};

export default {
  register,
  login
};