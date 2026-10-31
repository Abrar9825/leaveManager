import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  acknowledgeRules,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/acknowledge-rules', acknowledgeRules);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router;
