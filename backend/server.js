const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

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

// RUTAS - Adaptadas para PostgreSQL

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar si email existe
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, password]
    );

    console.log(`✅ Usuario registrado: ${email}`);
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: result.rows[0].id,
      name: name,
      email: email
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    console.log(`✅ Login exitoso: ${email}`);
    res.json({
      message: 'Login exitoso',
      userId: user.id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    console.error('Error al buscar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/dashboard/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Resumen financiero
    const financialResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM transactions 
      WHERE user_id = $1
    `, [userId]);

    const row = financialResult.rows[0];
    const income = parseFloat(row.total_income) || 0;
    const expenses = parseFloat(row.total_expenses) || 0;
    const balance = income - expenses;

    // Categorías con montos
    const categoriesResult = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        COALESCE(SUM(t.amount), 0) as amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type, amount DESC
    `, [userId]);

    res.json({
      financialData: { income, expenses, balance },
      categories: categoriesResult.rows.map(cat => ({
        ...cat,
        amount: parseFloat(cat.amount) || 0
      }))
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ error: 'Error al cargar datos del dashboard' });
  }
});

app.get('/api/categories/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      'SELECT id, name, type FROM categories WHERE user_id = $1 ORDER BY type, name',
      [userId]
    );

    res.json({ categories: result.rows });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { userId, name, type } = req.body;

  if (!userId || !name || !type) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de categoría inválido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id',
      [userId, name.trim(), type]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category: {
        id: result.rows[0].id,
        name: name.trim(),
        type: type
      }
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

app.delete('/api/categories/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
    // Verificar si tiene transacciones
    const checkTransactions = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
      [categoryId]
    );

    if (parseInt(checkTransactions.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una categoría que tiene movimientos asociados' 
      });
    }

    // Eliminar categoría
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

app.post('/api/movements', async (req, res) => {
  const { userId, description, amount, categoryId, type } = req.body;

  if (!userId || !description || !amount || !categoryId || !type) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de movimiento inválido' });
  }

  try {
    // Verificar categoría
    const categoryResult = await pool.query(
      'SELECT id, type as category_type FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }

    const category = categoryResult.rows[0];
    if (category.category_type !== type) {
      return res.status(400).json({ 
        error: 'El tipo de movimiento no coincide con el tipo de categoría' 
      });
    }

    // Crear transacción
    const result = await pool.query(
      'INSERT INTO transactions (user_id, category_id, description, amount, type, date) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING id',
      [userId, categoryId, description.trim(), amount, type]
    );

    res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movement: {
        id: result.rows[0].id,
        userId,
        categoryId,
        description: description.trim(),
        amount,
        type
      }
    });

  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error al crear movimiento' });
  }
});

app.get('/api/movements/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.type,
        t.date,
        t.category_id,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.date DESC, t.id DESC
    `, [userId]);

    const movements = result.rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      date: row.date,
      categoryId: row.category_id,
      categoryName: row.category_name
    }));

    res.json({ movements });

  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

app.delete('/api/movements/:movementId', async (req, res) => {
  const movementId = req.params.movementId;

  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1', [movementId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    res.json({ message: 'Movimiento eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ error: 'Error al eliminar movimiento' });
  }
});

app.get('/api/analysis/:userId', async (req, res) => {
  const userId = req.params.userId;
  const range = req.query.range || 'all';

  console.log(`📊 Solicitud de análisis para usuario ${userId}, rango: ${range}`);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  let dateCondition = '';
  let dateParams = [userId];

  if (range !== 'all') {
    const now = new Date();
    let startDate;

    switch (range) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      dateCondition = ' AND t.date >= $2';
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      dateParams.push(`${year}-${month}-${day}`);
    }
  }

  const query = `
    SELECT 
      t.id,
      t.description,
      t.amount,
      t.type,
      t.date,
      t.category_id,
      c.name as category_name,
      c.type as category_type
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = $1${dateCondition}
    ORDER BY t.date DESC, t.id DESC
  `;

  console.log(`🔍 Ejecutando consulta de análisis...`);

  try {
    const result = await pool.query(query, dateParams);
    
    console.log(`✅ Consulta exitosa: ${result.rows.length} transacciones encontradas`);

    const movements = result.rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount) || 0,
      type: row.type,
      date: row.date,
      category_id: row.category_id,
      category_name: row.category_name
    }));

    const categoriesMap = new Map();
    result.rows.forEach(row => {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          type: row.category_type
        });
      }
    });

    const categories = Array.from(categoriesMap.values());

    console.log(`📈 Enviando respuesta: ${movements.length} movimientos, ${categories.length} categorías`);

    res.json({ 
      movements, 
      categories,
      summary: {
        totalTransactions: movements.length,
        dateRange: range,
        hasData: movements.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error en consulta de análisis:', error);
    res.status(500).json({ error: 'Error al obtener datos de análisis' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente', 
    database: 'PostgreSQL',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API de finanzas personales con PostgreSQL iniciada exitosamente`);
});

process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  pool.end(() => {
    console.log('✅ Conexión PostgreSQL cerrada');
    process.exit(0);
  });
});

module.exports = app;