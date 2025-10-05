const { Pool } = require('pg');

// ⚠️ [CONFIGURACIÓN REAL DE RAILWAY]
const config = {
    host: 'trolley.proxy.rlwy.net',
    port: 19089,
    user: 'postgres',
    password: 'IitLvfReKkqrdUGrIJEZlLXcbJUimsaf',
    database: 'railway',
    // Requerido por la conexión Railway
    ssl: {
        rejectUnauthorized: false
    }
};

const pool = new Pool(config);

pool.on('error', (err, client) => {
    // Si la conexión falla después de un tiempo, nos alertará
    console.error('⚠️ Error inesperado en el cliente inactivo de PostgreSQL', err);
});

/**
 * Inicializa la base de datos creando las tablas si no existen.
 * Esta función es llamada una única vez al iniciar el servidor.
 */
const initDatabase = async () => {
    console.log('⚙️ Iniciando verificación de esquema de base de datos...');
    try {
        // La tabla USERS: Usamos 'password_hash' para el campo de seguridad
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL, 
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // La tabla CATEGORIES: Aseguramos la unicidad por usuario
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
                UNIQUE (user_id, name)
            );
        `);

        // La tabla TRANSACTIONS: Usamos ON DELETE RESTRICT (Mejor Práctica)
        // ON DELETE RESTRICT: Evita que se elimine una categoría si tiene movimientos asociados.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
                description VARCHAR(255) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Esquema de base de datos verificado y listo.');
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos (CREATE TABLE):', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    initDatabase // Exportamos la función de inicialización para el server.js
};