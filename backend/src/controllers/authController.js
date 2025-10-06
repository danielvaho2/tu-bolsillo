// El controlador solo importa el servicio de autenticación
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

// Obtener la clave secreta del token desde las variables de entorno
// Nota: Aquí se asume que JWT_SECRET está disponible en el entorno de Node.js
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_fallback'; 

// ---------------------------------------------
// CONTROLADORES DE AUTENTICACIÓN
// ---------------------------------------------

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Objeto de usuario (sin hash)
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
    // El token incluye el ID y el email del usuario
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '1d', // Expira en 1 día
    });
};

/**
 * Maneja la solicitud de registro de un nuevo usuario.
 * Ruta: POST /api/auth/register
 */
const register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validación básica de entrada
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos: nombre, email y contraseña.' });
    }

    try {
        const newUser = await authService.register(name, email, password);
        
        // Generar token
        const token = generateToken(newUser);

        // Respuesta exitosa
        return res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            token: token
        });

    } catch (error) {
        // El servicio lanza errores con código de estado, los usamos aquí
        const status = error.status || 500;
        const message = error.message || 'Error interno del servidor al registrar el usuario.';
        return res.status(status).json({ error: message });
    }
};

/**
 * Maneja la solicitud de inicio de sesión de un usuario.
 * Ruta: POST /api/auth/login
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos: email y contraseña.' });
    }

    try {
        const user = await authService.login(email, password);

        // Generar token
        const token = generateToken(user);

        // Respuesta exitosa
        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            token: token
        });

    } catch (error) {
        // El servicio lanza errores de credenciales (401)
        const status = error.status || 500;
        const message = error.message || 'Error interno del servidor al iniciar sesión.';
        return res.status(status).json({ error: message });
    }
};

module.exports = {
    register,
    login,
};
