  // backend/src/services/authService.js
  import { findUserByEmail, createUser } from '../db/userReporitory.js';
  import bcrypt from 'bcrypt';
  import jwt from 'jsonwebtoken';

  const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

  /**
   * Genera un token JWT para el usuario
   * @param {object} user - Objeto de usuario (id, email, name)
   * @returns {string} El token JWT
   */
  const generateToken = (user) => {
    return jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1d' }
    );
  };

  /**
   * Lógica para registrar un nuevo usuario
   * @param {string} name - Nombre del usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {object} { user, token }
   */
  export const register = async (name, email, password) => {
    try {
      // 1. Verificar si el usuario ya existe
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        const error = new Error('El usuario con este email ya existe');
        error.status = 409;
        throw error;
      }

      // 2. Hashear la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 3. Crear el usuario en la BD (pasando parámetros individuales)
      const newUser = await createUser(name, email, hashedPassword);
      
      // 4. Generar token
      const token = generateToken(newUser);

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        token
      };
    } catch (error) {
      console.error('Error en register:', error.message);
      if (error.status) throw error;
      
      const serviceError = new Error('Error en el servicio de registro');
      serviceError.status = 500;
      throw serviceError;
    }
  };

  /**
   * Lógica para el inicio de sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano ingresada
   * @returns {object} { user, token }
   */
  export const login = async (email, password) => {
    try {
      // 1. Buscar usuario por email
      const user = await findUserByEmail(email);

      if (!user) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
      }

      // 2. Obtener la contraseña hasheada
      const hashedPassword = user.password;
      
      if (!hashedPassword) {
        const error = new Error('Error de configuración de contraseña para el usuario');
        error.status = 500;
        throw error;
      }

      // 3. Comparar la contraseña ingresada con el hash almacenado
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (!passwordMatch) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
      }

      // 4. Generar token
      const token = generateToken(user);

      //si coincide se devuelve el usuario
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      };
    } catch (error) {
      console.error('Error en login:', error.message);
      if (error.status) throw error;
      
      const serviceError = new Error('Error de autenticación');
      serviceError.status = 500;
      throw serviceError;
    }
  };

  /**
   * Verifica un token JWT
   * @param {string} token - Token JWT
   * @returns {object|null} Payload del token o null si es inválido
   */
  export const verifyToken = (token) => {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      return null;
    }
  };

  export default {
    register,
    login,
    verifyToken
  };