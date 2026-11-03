import express from 'express';
import {
  punchIn,
  updateAttendance,
  getAttendance,
  getTodayAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/punch', punchIn);
router.put('/:id', updateAttendance);
router.get('/', getAttendance);
router.get('/today', getTodayAttendance);
router.delete('/:id', deleteAttendance);

export default router;
