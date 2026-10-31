import express from 'express';
import {
  getBalances,
  getBalanceByYear,
  adjustBalance,
  getBalanceHistory,
} from '../controllers/balanceController.js';

const router = express.Router();

router.get('/', getBalances);
router.post('/adjust', adjustBalance);
router.get('/history', getBalanceHistory);
router.get('/:year', getBalanceByYear);

export default router;

