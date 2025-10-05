// src/db/userRepository.js

// Importamos el pool de conexión para acceder a la base de datos
const { pool } = require('../config/dbConfig');

/**
 * Busca un usuario por email. Utilizado para verificar si un email ya está registrado.
 * @param {string} email - El email a buscar.
 * @returns {object | undefined} El primer usuario encontrado (si existe).
 */
exports.findByEmail = async (email) => {
    try {
        // Consulta SQL extraída de la lógica de registro
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        return result.rows[0];
    } catch (error) {
        // Manejo de error de base de datos
        console.error('Error en findByEmail:', error);
        throw new Error('Database error during email lookup.');
    }
};

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {string} name - Nombre del usuario.
 * @param {string} email - Email único del usuario.
 * @param {string} password - Contraseña del usuario (sin cifrar por ahora).
 * @returns {object} El objeto de usuario creado (ID, nombre, email).
 */
exports.createUser = async (name, email, password) => {
    try {
        // Consulta SQL extraída de la lógica de registro (INSERT INTO users)
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, password]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error en createUser:', error);
        throw new Error('Database error during user creation.');
    }
};

/**
 * Busca un usuario por email y contraseña. Utilizado para el login.
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {object | undefined} El usuario encontrado o undefined si las credenciales fallan.
 */
exports.findUserForLogin = async (email, password) => {
    try {
        // Consulta SQL extraída de la lógica de login
        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error en findUserForLogin:', error);
        throw new Error('Database error during login lookup.');
    }
};