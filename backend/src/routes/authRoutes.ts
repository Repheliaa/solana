import { Router } from 'express';
import { login, register, getMe, getCategories } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.get('/categories', getCategories);

export default router;
