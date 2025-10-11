import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Rutas de Autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
