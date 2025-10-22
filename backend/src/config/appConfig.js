import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Importa helmet
import categoryRoutes from '../routes/categoryRoutes.js';
import transactionRoutes from '../routes/transactionRoutes.js';
import authRoutes from '../routes/authRoutes.js';

const app = express();

// Desactivar la cabecera 'X-Powered-By' para mejorar la seguridad
app.disable('x-powered-by');

// Middleware de seguridad (Helmet)
app.use(helmet()); // Usa helmet para añadir cabeceras de seguridad

// Configurar CORS para permitir solicitudes solo desde 'https://www.tu-bolsillo.com' esto se pone cuando ya este deplegado
//De momento solo se pone * porque no esta d esplegado  
const corsOptions = {
  origin: '*',  // Solo permitir este dominio
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Métodos permitidos
  credentials: true,  // Permitir el envío de cookies, si es necesario
};

app.use(cors(corsOptions));  // Aplica CORS con las opciones configuradas

// Middleware para procesar JSON
app.use(express.json());

// Rutas
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

export default app;