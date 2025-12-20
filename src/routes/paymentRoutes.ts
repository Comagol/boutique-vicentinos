import { Router } from "express";
import { orderController } from "../controllers/orderController";

const router = Router();

//GET y POST api/payments/return procesar retorno desde Mercado Pago (public)
//Mercado Pago puede redirigir con GET o POST dependiendo de la configuración
router.get('/return', orderController.handlePaymentReturn);
router.post('/return', orderController.handlePaymentReturn);

//POST api/payments/webhook webhook de mercado pago
router.post('/webhook', orderController.handleWebhook);

export default router;