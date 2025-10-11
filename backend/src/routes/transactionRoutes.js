import express from 'express';
import * as transactionController from '../controllers/transactionController.js';

const router = express.Router();

router.get('/:userId', transactionController.getMovements);

router.post('/', transactionController.createMovement);

router.delete('/:id', transactionController.deleteMovement);


export default router;
