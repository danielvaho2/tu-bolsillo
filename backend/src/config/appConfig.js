import express from 'express';
import cors from 'cors';
import categoryRoutes from '../routes/categoryRoutes.js';
import transactionRoutes from '../routes/transactionRoutes.js';
import authRoutes from '../routes/authRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

export default app;
