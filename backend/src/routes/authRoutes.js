const express = require('express');
const router = express.Router();
// Importamos el controlador
const authController = require('../controllers/authController');

// Rutas de Autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
