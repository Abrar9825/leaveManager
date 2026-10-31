import express from 'express';
import {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
} from '../controllers/leaveController.js';

const router = express.Router();

router.route('/')
  .get(getLeaves)
  .post(createLeave);

router.route('/:id')
  .get(getLeaveById)
  .put(updateLeave)
  .delete(deleteLeave);

export default router;

