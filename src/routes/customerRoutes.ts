import { Router } from "express";
import { customerController } from "../controllers/customerController";
import { authenticate, requireCustomer } from "../middleware/auth";

const router = Router();

// ======== PUBLIC ROUTES ==========
//Signup (POST /api/customers/signup)
router.post('/signup', customerController.signup);

//Login (POST /api/customers/login)
router.post('/login', customerController.login);

//Cambiar Contraseña (PUT /api/customers/change-password)
router.put('/change-password', authenticate, requireCustomer, customerController.changePassword);

//Get Profile (GET /api/customers/profile)
router.get('/orders', authenticate, requireCustomer, customerController.getOrders);

export default router;