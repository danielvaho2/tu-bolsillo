import express from 'express';
import * as transactionController from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', transactionController.createMovement);
router.get('/:userId', transactionController.getMovements);
router.delete('/:id', transactionController.deleteMovement);

export default router;
