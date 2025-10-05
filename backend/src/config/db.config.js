// Configuración de PostgreSQL (Railway)
const pool = new Pool({
  host: 'trolley.proxy.rlwy.net',
  port: 19089,
  user: 'postgres',
  password: 'IitLvfReKkqrdUGrIJEZlLXcbJUimsaf',
  database: 'railway',
  ssl: {
    rejectUnauthorized: false
  }
});

const initDatabase = async () => {
  try {
    // Tabla users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('income', 'expense')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )
    `);

    // Tabla transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        description VARCHAR(500) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        type VARCHAR(50) CHECK (type IN ('income', 'expense')),
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas creadas/verificadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
  }
};

// Inicializar base de datos
initDatabase();

// Test de conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos PostgreSQL');
    if (release) release();
  }
});
// Exportar el pool y la función de inicialización para que otros módulos (Repositorios) puedan acceder a la DB
module.exports = {
    pool,
    initDatabase
};