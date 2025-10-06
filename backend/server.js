import express from 'express'; // CORREGIDO: import en lugar de require
import cors from 'cors'; // CORREGIDO: import en lugar de require
import 'dotenv/config'; // Usar import para cargar variables de entorno (si usas un paquete como dotenv)

// ✅ [RUTA CORREGIDA] Apunta a db.config.js
import { pool, initDatabase } from './src/config/db.config.js'; // Añadir .js al final de los archivos locales

// ✅ [RUTAS CORREGIDAS]
// Usamos import * as X para importar todos los exports del servicio
import * as authService from './src/services/authService.js'; 
import * as categoryService from './src/services/categoryService.js';
import * as transactionService from './src/services/transactionService.js';

const app = express();
const PORT = process.env.PORT || 5001;


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
    // Usamos authService.register
    const user = await authService.register(name, email, password); 
    console.log(`✅ Usuario registrado: ${email}`);
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: user.user.id, // Acceder a la propiedad 'user'
      name: user.user.name,
      email: user.user.email
    });
  } catch (error) {
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
    // Usamos authService.login
    const user = await authService.login(email, password); 
    console.log(`✅ Login exitoso: ${email}`);
    res.json({
      message: 'Login exitoso',
      userId: user.user.id, // Acceder a la propiedad 'user'
      name: user.user.name,
      email: user.user.email
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error de autenticación' });
  }
});


// [DASHBOARD & ANÁLISIS] ----------------------------------------

app.get('/api/dashboard/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Usamos transactionService.getDashboardData
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
    // Usamos transactionService.getAnalysis (asumiendo que existe)
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
    // Usamos categoryService.get
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
    // Usamos categoryService.create
    const category = await categoryService.create(userId, name, type); 
    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category 
    });
  } catch (error) {
    console.error('Error al crear categoría:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error al crear categoría' });
  }
});

app.delete('/api/categories/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  const { userId } = req.body; 

  try {
    // Usamos categoryService.remove
    const result = await categoryService.remove(categoryId, userId); 
    res.json(result);
  } catch (error) {
    console.error('Error al eliminar categoría:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error al eliminar categoría' });
  }
});

// [MOVIMIENTOS] -------------------------------------------------

app.post('/api/movements', async (req, res) => {
  const { userId, description, amount, categoryId, date } = req.body; // Eliminado 'type' ya que se obtiene de la categoría

  if (!userId || !description || !amount || !categoryId || !date) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  try {
    // Usamos transactionService.createTransaction (la función correcta del servicio)
    const movement = await transactionService.createTransaction(userId, categoryId, description, amount, date); 
    res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movement
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error al crear movimiento' });
  }
});

app.get('/api/movements/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Usamos transactionService.getTransactions (la función correcta del servicio)
    const movements = await transactionService.getTransactions(userId); 
    res.json({ movements });
  } catch (error) {
    console.error('Error al obtener movimientos:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Error al obtener movimientos' });
  }
});

app.delete('/api/movements/:movementId', async (req, res) => {
  const movementId = req.params.movementId;
  const { userId } = req.body; 

  try {
    // Usamos transactionService.deleteTransactionService (la función correcta del servicio)
    const result = await transactionService.deleteTransactionService(movementId, userId); 
    res.json(result);
  } catch (error) {
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

// ⚠️ [CAMBIO CRÍTICO] La inicialización de la DB debe ser asíncrona y bloquear el inicio del servidor
const startServer = async () => {
    try {
        await initDatabase(); // Llama a la inicialización de la DB
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📊 API de finanzas personales con PostgreSQL iniciada exitosamente`);
        });

    } catch (error) {
        console.error('❌ Error fatal al iniciar la aplicación (Fallo de DB):', error.message);
        // Si la DB falla, salimos del proceso
        pool.end();
        process.exit(1); 
    }
};

startServer(); // Ejecuta la función de inicio

process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  // Aseguramos el cierre de la conexión de la DB al apagar el servidor
  pool.end(() => {
    console.log('✅ Conexión PostgreSQL cerrada');
    process.exit(0);
  });
});

// En ES Modules, no se usa 'module.exports = app;'
// Si la aplicación cliente espera que el servidor se exporte, se puede usar:
// export default app;