import { findUserByEmail, createUser } from '../db/userReporitory.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

/**
 * Genera un token JWT para el usuario.
 * @param {object} user - Objeto de usuario (id, email, name).
 * @returns {string} El token JWT.
 */
const generateToken = (user) => {
    // Genera el token solo con información no sensible
    return jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1d' });
};

/**
 * Lógica para registrar un nuevo usuario.
 * @param {string} name - Nombre del usuario.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña en texto plano.
 * @returns {object} { user, token }
 */
export const register = async (name, email, password) => {
    try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            throw new Error('El usuario con este email ya existe');
        }

        // 2. Hashear la contraseña (Seguridad es importante, aunque tu base de datos no lo refleje aún)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Crear el usuario en la BD.
        // NOTA IMPORTANTE: Si tu tabla 'users' en la base de datos solo tiene 'password'
        // y no 'password_hash', esta función de repositorio debe estar insertando el hash
        // en la columna 'password'.
        const newUser = await createUser(name, email, hashedPassword);
        
        // 4. Generar token
        const token = generateToken(newUser);

        return { user: { id: newUser.id, name: newUser.name, email: newUser.email }, token };

    } catch (error) {
        console.error('Error en register:', error);
        throw new Error(error.message || 'Error en el servicio de registro');
    }
};

/**
 * Lógica para el inicio de sesión.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña en texto plano ingresada.
 * @returns {object} { user, token }
 */
export const login = async (email, password) => {
    try {
        // 1. Buscar usuario por email
        const user = await findUserByEmail(email);

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        // 2. Obtener la contraseña hasheada del objeto 'user'
        // CORRECCIÓN CLAVE: Debe usar 'user.password' ya que la columna en la BD se llama 'password'
        // Si el esquema usara un nombre más seguro, sería 'user.password_hash'.
        const hashedPassword = user.password;
        
        if (!hashedPassword) {
            // Este caso debería ser imposible si el registro fue correcto,
            // pero previene errores si el campo 'password' está nulo.
            throw new Error('Error de configuración de contraseña para el usuario.');
        }

        // 3. Comparar la contraseña ingresada con el hash almacenado
        // ¡Aquí es donde ocurría el error! El segundo argumento era undefined.
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (!passwordMatch) {
            throw new Error('Credenciales inválidas');
        }

        // 4. Generar token
        const token = generateToken(user);

        return { user: { id: user.id, name: user.name, email: user.email }, token };

    } catch (error) {
        console.error('Error en login:', error);
        throw new Error(error.message || 'Error de autenticación');
    }
};

// Se mantiene esta función por si otras partes de la API la necesitan.
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null; // Token inválido
    }
};