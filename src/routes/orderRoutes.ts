import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// ======== PUBLIC ROUTES ==========
//Post /api/orders crear orden (public)
router.post('/', orderController.createOrder);


