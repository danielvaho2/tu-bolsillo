import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

router.get('/:userId', categoryController.getCategories);
// otras rutas...

export default router;
