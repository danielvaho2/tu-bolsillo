const express = require('express');
const cors = require('cors');

// Importamos la conexión de la DB para el cierre del servidor
const { pool } = require('./src/config/dbConfig'); 

// ⚠️ [ETAPA 4] Importamos la capa de Servicios
const authService = require('./src/services/authService');
const categoryService = require('./src/services/categoryService');
const transactionService = require('./src/services/transactionService');


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


// ***************************************************************
// CONTROLADORES (RUTAS) - Solo reciben peticiones y llaman a Servicios
// ***************************************************************

// [AUTH] --------------------------------------------------------

app.post('/api/register', async (req, res) => {
 const { name, email, password } = req.body;

 // Validación básica de campos obligatorios (Controlador)
 if (!name || !email || !password) {
  return res.status(400).json({ error: 'Todos los campos son obligatorios' });
 }
 if (password.length < 6) {
  return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
 }

 try {
  const user = await authService.register(name, email, password);
  console.log(`✅ Usuario registrado: ${email}`);
  res.status(201).json({
   message: 'Usuario registrado exitosamente',
   userId: user.id,
   name: user.name,
   email: user.email
  });
 } catch (error) {
  // Usa el status personalizado del servicio (409) o default a 500
  console.error('Error en registro:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al crear usuario' });
 }
});

app.post('/api/login', async (req, res) => {
 const { email, password } = req.body;

 if (!email || !password) {
  return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
 }

 try {
  const user = await authService.login(email, password);
  console.log(`✅ Login exitoso: ${email}`);
  res.json({
   message: 'Login exitoso',
   userId: user.id,
   name: user.name,
   email: user.email
  });
 } catch (error) {
  // Usa el status personalizado del servicio (401) o default a 500
  console.error('Error en login:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error de autenticación' });
 }
});


// [DASHBOARD & ANÁLISIS] ----------------------------------------

app.get('/api/dashboard/:userId', async (req, res) => {
 const userId = req.params.userId;

try {
  const data = await transactionService.getDashboardData(userId);
  res.json(data);
 } catch (error) {
  console.error('Error al obtener datos del dashboard:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al cargar datos del dashboard' });
 }
});

app.get('/api/analysis/:userId', async (req, res) => {
 const userId = req.params.userId;
 const range = req.query.range || 'all';

 if (!userId || isNaN(userId)) {
  return res.status(400).json({ error: 'ID de usuario inválido' });
 }

 console.log(`📊 Solicitud de análisis para usuario ${userId}, rango: ${range}`);

 try {
  const data = await transactionService.getAnalysis(userId, range);
  console.log(`📈 Análisis enviado: ${data.movements.length} movimientos, ${data.categories.length} categorías`);
  res.json(data);
 } catch (error) {
  console.error('❌ Error en consulta de análisis:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al obtener datos de análisis' });
 }
});

// [CATEGORÍAS] --------------------------------------------------

app.get('/api/categories/:userId', async (req, res) => {
 const userId = req.params.userId;

 try {
  const categories = await categoryService.get(userId);
  res.json({ categories });
 } catch (error) {
  console.error('Error al obtener categorías:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al obtener categorías' });
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
  const category = await categoryService.create(userId, name, type);
  res.status(201).json({
   message: 'Categoría creada exitosamente',
   category 
  });
 } catch (error) {
  // Usa el status personalizado del servicio (400 si ya existe)
  console.error('Error al crear categoría:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al crear categoría' });
 }
});

app.delete('/api/categories/:categoryId', async (req, res) => {
 const categoryId = req.params.categoryId;
 // Asumimos que el userId viene en el body o se extrae del token, lo necesitamos para la seguridad
 const { userId } = req.body; 

 try {
  const result = await categoryService.remove(categoryId, userId);
  res.json(result);
 } catch (error) {
  // Usa el status personalizado (400 si tiene movimientos, 404 si no existe)
  console.error('Error al eliminar categoría:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al eliminar categoría' });
 }
});

// [MOVIMIENTOS] -------------------------------------------------

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
  const movement = await transactionService.create(userId, description, amount, categoryId, type);
  res.status(201).json({
   message: 'Movimiento registrado exitosamente',
   movement
  });
 } catch (error) {
  // Usa el status personalizado del servicio (400 si la categoría es inválida)
  console.error('Error al crear movimiento:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al crear movimiento' });
 }
});

app.get('/api/movements/:userId', async (req, res) => {
 const userId = req.params.userId;

 try {
  const movements = await transactionService.getAll(userId);
  res.json({ movements });
 } catch (error) {
  console.error('Error al obtener movimientos:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al obtener movimientos' });
 }
});

app.delete('/api/movements/:movementId', async (req, res) => {
 const movementId = req.params.movementId;
 // Asumimos que el userId viene en el body o se extrae del token, lo necesitamos para la seguridad
 const { userId } = req.body; 

 try {
  const result = await transactionService.remove(movementId, userId);
  res.json(result);
 } catch (error) {
  // Usa el status personalizado (404 si no existe)
  console.error('Error al eliminar movimiento:', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Error al eliminar movimiento' });
 }
});


// [HEALTH CHECK] Ruta básica de verificación
app.get('/api/health', (req, res) => {
 res.json({ 
  message: 'Servidor funcionando correctamente', 
  database: 'PostgreSQL',
  timestamp: new Date().toISOString() 
 });
});


// Middleware global para errores (debe quedar al final, antes del listen)
app.use((err, req, res, next) => {
 console.error('Error no manejado:', err.stack);
 res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
 console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
 console.log(`📊 API de finanzas personales con PostgreSQL iniciada exitosamente`);
});

process.on('SIGINT', () => {
 console.log('\n🔄 Cerrando servidor...');
 // Aseguramos el cierre de la conexión de la DB al apagar el servidor
 pool.end(() => {
  console.log('✅ Conexión PostgreSQL cerrada');
  process.exit(0);
 });
});

module.exports = app;
