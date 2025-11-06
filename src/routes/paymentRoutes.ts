import { Router } from "express";
import { orderController } from "../controllers/orderController";

const router = Router();

//POST api/payments/webhook webhook de mercado pago
router.post('/webhook', orderController.handleWebhook);

export default router;