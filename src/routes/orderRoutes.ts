import { Router } from "express";
import { orderController } from "../controllers/orderController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// ======== PUBLIC ROUTES ==========
//Post /api/orders crear orden (public)
router.post('/', orderController.createOrder);

//Get /api/orders/number/:orderNumber obtener orden por numero de orden (public)
router.get('/number/:orderNumber', orderController.getOrderByNumber);

//Post /api/orders/cancel cancelar orden (public)
router.post('/cancel', orderController.cancelOrder);

//Post /api/orders/confirm-payment confirmar pago (public)
router.post('/confirm-payment', orderController.confirmPayment);

// ======== PRIVATE ROUTES ==========
router.use(authenticate, requireAdmin);

//Get /api/orders obtener todas las ordenes (Admin)
router.get('/', orderController.getAllOrders);

//Get /api/orders/:id obtener orden por id (Admin)
router.get('/:id', orderController.getOrderById);

//Post /api/orders/mark-delivered marcar orden como entregada (Admin)
router.post('/mark-delivered', orderController.markAsDelivered);

//Get /api/orders/expiring-soon obtener ordenes proximas a expirar (Admin)
router.get('/expiting-soon', orderController.getOrdersExpiringSoon);