// backend/server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { pool, initDatabase } from './src/config/db.config.js';

// Importar controllers
import * as authController from './src/controllers/authController.js';
import * as transactionController from './src/controllers/transactionController.js';
import * as categoryController from './src/controllers/categoryController.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

/**
 * Registro de nuevo usuario
 * POST /api/register
 */
app.post('/api/register', authController.register);

/**
 * Inicio de sesión
 * POST /api/login
 */
app.post('/api/login', authController.login);

// ============================================
// RUTAS DE DASHBOARD Y ANÁLISIS
// ============================================

/**
 * Obtiene datos del dashboard
 * GET /api/dashboard/:userId
 */
app.get('/api/dashboard/:userId', transactionController.getDashboard);

/**
 * Obtiene análisis financiero
 * GET /api/analysis/:userId?range=all
 */
app.get('/api/analysis/:userId', transactionController.getAnalysis);

// ============================================
// RUTAS DE CATEGORÍAS
// ============================================

/**
 * Obtiene todas las categorías de un usuario
 * GET /api/categories/:userId
 */
app.get('/api/categories/:userId', categoryController.getCategories);

/**
 * Crea una nueva categoría
 * POST /api/categories
 */
app.post('/api/categories', categoryController.createCategory);

/**
 * Elimina una categoría
 * DELETE /api/categories/:categoryId
 */
app.delete('/api/categories/:categoryId', categoryController.deleteCategory);

// ============================================
// RUTAS DE MOVIMIENTOS (TRANSACCIONES)
// ============================================

/**
 * Crea un nuevo movimiento
 * POST /api/movements
 */
app.post('/api/movements', transactionController.createMovement);

/**
 * Obtiene todos los movimientos de un usuario
 * GET /api/movements/:userId
 */
app.get('/api/movements/:userId', transactionController.getMovements);

/**
 * Elimina un movimiento
 * DELETE /api/movements/:movementId
 */
app.delete('/api/movements/:movementId', transactionController.deleteMovement);

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Ruta de verificación del servidor
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Servidor funcionando correctamente',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ============================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

/**
 * Inicia el servidor de forma asíncrona
 * Primero inicializa la base de datos, luego arranca el servidor
 */
const startServer = async () => {
  try {
    // Inicializar base de datos
    await initDatabase();

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 API de finanzas personales con PostgreSQL iniciada exitosamente`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar la aplicación:', error.message);
    pool.end();
    process.exit(1);
  }
};

// Ejecutar inicio del servidor
startServer();

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================

process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  pool.end(() => {
    console.log('✅ Conexión PostgreSQL cerrada');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Cerrando servidor (SIGTERM)...');
  pool.end(() => {
    console.log('✅ Conexión PostgreSQL cerrada');
    process.exit(0);
  });
});

export default app;