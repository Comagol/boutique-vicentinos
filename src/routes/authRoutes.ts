import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

//Auth routes
//Login (POST /api/auth/login)
router.post('/login', authController.login);

//Signup (POST /api/auth/signup)
router.post('/signup', authController.signup);

//Cambiar contraseña (PUT /api/auth/change-password)
router.put('/change-password', authenticate, authController.changePassword);

export default router;