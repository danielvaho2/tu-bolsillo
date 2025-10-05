onst express = require('express');
const cors = require('cors');

// Importamos la conexión de la DB (Etapa 1)
const { pool } = require('./src/config/dbConfig'); 

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

// ⚠️ [NOTA IMPORTANTE] Aquí irán las importaciones de tus rutas en la Etapa 4.

// ***************************************************************
// RUTAS MONOLÍTICAS TEMPORALES (CONTROLADOR)
// Serán migradas y eliminadas en la Etapa 4 al implementar los Controladores.
// ***************************************************************

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
        // La lógica funcional se reemplazará por la llamada a authService.register() en Etapa 4
    res.status(201).json({
      message: 'Usuario registrado (LÓGICA PENDIENTE)',
      userId: 1, 
      name: name,
      email: email
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error al crear usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
        // La lógica funcional se reemplazará por la llamada a authService.login() en Etapa 4
    res.json({
      message: 'Login exitoso (LÓGICA PENDIENTE)',
      userId: 1,
      name: "Usuario",
      email: email
    });

  } catch (error) {
    console.error('Error al buscar usuario:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
});

app.get('/api/dashboard/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
        // La lógica funcional se reemplazará por la llamada a transactionService.getDashboardData() en Etapa 4
    res.json({
      financialData: { income: 1000, expenses: 500, balance: 500 },
      categories: [{id: 1, name: 'Comida', type: 'expense', amount: 300}]
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(error.status || 500).json({ error: 'Error al cargar datos del dashboard' });
  }
});

app.get('/api/categories/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
        // La lógica funcional se reemplazará por la llamada a categoryService.get() en Etapa 4
    res.json({ categories: [{id: 1, name: 'Comida', type: 'expense'}] });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(error.status || 500).json({ error: 'Error al obtener categorías' });
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
        // La lógica funcional se reemplazará por la llamada a categoryService.create() en Etapa 4
    res.status(201).json({
      message: 'Categoría creada exitosamente (LÓGICA PENDIENTE)',
      category: {
        id: 10,
        name: name.trim(),
        type: type
      }
    });

  } catch (error) {
    // Dejamos el manejo de error de Unique violation aquí temporalmente
    if (error.code === '23505') { 
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error('Error al crear categoría:', error);
    res.status(error.status || 500).json({ error: 'Error al crear categoría' });
  }
});

app.delete('/api/categories/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  const { userId } = req.body; 

  try {
        // La lógica funcional se reemplazará por la llamada a categoryService.remove() en Etapa 4
    // Las validaciones de negocio (ej. 'No se puede eliminar una categoría que tiene movimientos')
    // deben ser lanzadas desde el servicio.
    res.json({ message: 'Categoría eliminada exitosamente (LÓGICA PENDIENTE)' });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error al eliminar categoría' });
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
        // La lógica funcional se reemplazará por la llamada a transactionService.create() en Etapa 4
        
    res.status(201).json({
      message: 'Movimiento registrado exitosamente (LÓGICA PENDIENTE)',
      movement: {
        id: 100,
        userId,
        categoryId,
        description: description.trim(),
        amount,
        type
      }
    });

  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error al crear movimiento' });
  }
});

app.get('/api/movements/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
        // La lógica funcional se reemplazará por la llamada a transactionService.getAll() en Etapa 4
    const movements = [{id: 100, description: 'Sueldo', amount: 1000, type: 'income', categoryName: 'Salario'}];

    res.json({ movements });

  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(error.status || 500).json({ error: 'Error al obtener movimientos' });
  }
});

app.delete('/api/movements/:movementId', async (req, res) => {
  const movementId = req.params.movementId;

  try {
        // La lógica funcional se reemplazará por la llamada a transactionService.remove() en Etapa 4
    res.json({ message: 'Movimiento eliminado exitosamente (LÓGICA PENDIENTE)' });

  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(error.status || 500).json({ error: 'Error al eliminar movimiento' });
  }
});

app.get('/api/analysis/:userId', async (req, res) => {
  const userId = req.params.userId;
  const range = req.query.range || 'all';

  console.log(`📊 Solicitud de análisis para usuario ${userId}, rango: ${range}`);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }
    
  try {
        // La lógica funcional se reemplazará por la llamada a transactionService.getAnalysis() en Etapa 4
    console.log(`✅ Consulta exitosa: 0 transacciones encontradas`);

    res.json({ 
      movements: [], 
      categories: [],
      summary: { totalTransactions: 0, dateRange: range, hasData: false }
    });

  } catch (error) {
    console.error('❌ Error en consulta de análisis:', error);
    res.status(error.status || 500).json({ error: 'Error al obtener datos de análisis' });
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
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
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
```
---

## 2. ⏭️ Siguiente Paso: Etapa 3 - Capa de Servicios (Categorías)

Ahora que tenemos los repositorios (la capa de datos) listos y el servidor limpio, vamos a implementar la lógica de negocio para las categorías.

### Paso 3.2: Implementación de `src/services/categoryService.js`

Este archivo usará las funciones de `categoryRepository.js` y `transactionRepository.js` para aplicar las reglas de negocio, especialmente la lógica de **verificación antes de la eliminación**.

```javascript
// src/services/categoryService.js

const categoryRepository = require('../db/categoryRepository');
// Necesitamos el repositorio de transacciones para verificar si la categoría está en uso.
const transactionRepository = require('../db/transactionRepository'); 

/**
 * Lógica de negocio para crear una categoría.
 */
exports.create = async (user_id, name, type) => {
    // 1. Validaciones básicas de negocio (las del controlador ya se ejecutaron, pero el servicio asegura)
    if (!name || !type) {
        throw new Error('El nombre y el tipo de categoría son obligatorios.');
    }
    if (!['income', 'expense'].includes(type)) {
        throw new Error('Tipo de categoría inválido. Debe ser "income" o "expense".');
    }
    
    // 2. Acceso a la capa de datos (Repositorio)
    try {
        const category = await categoryRepository.createCategory(user_id, name.trim(), type);
        return category;
    } catch (error) {
        // Manejamos el error de violación de unicidad (código 23505) aquí o lo relanzamos
        if (error.code === '23505') {
             throw new Error('Ya existe una categoría con ese nombre para este usuario.');
        }
        throw error; // Relanzar otros errores de DB
    }
};

/**
 * Obtiene todas las categorías de un usuario.
 */
exports.get = async (user_id) => {
    // No hay mucha lógica de negocio, solo pasamos la solicitud al repositorio.
    return categoryRepository.getUsersCategories(user_id);
};

/**
 * Lógica de negocio para eliminar una categoría.
 * Incluye la regla de verificar movimientos antes de eliminar.
 */
exports.remove = async (category_id, user_id) => {
    // 1. Regla de negocio: Verificar si la categoría tiene transacciones.
    const transactionCount = await categoryRepository.countTransactionsInCategory(category_id);
    
    if (transactionCount > 0) {
        // Lanzamos un error que el Controlador (en server.js) debe capturar y enviar como 400
        const err = new Error('No se puede eliminar una categoría que tiene movimientos asociados');
        err.status = 400; // Propiedad para que el controlador sepa qué HTTP status usar
        throw err;
    }
    
    // 2. Acceso a la capa de datos (Repositorio) para eliminar
    const wasDeleted = await categoryRepository.deleteCategory(category_id, user_id);

    if (!wasDeleted) {
        const err = new Error('Categoría no encontrada o no pertenece al usuario.');
        err.status = 404;
        throw err;
    }

    return { message: 'Categoría eliminada exitosamente' };
};