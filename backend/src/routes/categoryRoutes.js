import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

router.get('/:userId', categoryController.getCategories);
router.post('/', categoryController.createCategory); // ✅ esta línea es clave

// otras rutas...

export default router;
