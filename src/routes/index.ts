import { Router } from "express";
import authRoutes from "./authRoutes";
import productRoutes from "./productRoutes";
import orderRoutes from "./orderRoutes";
import paymentRoutes from "./paymentRoutes";
import customerRoutes from "./customerRoutes";

const router = Router();

//montar todas las rutas
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/customers', customerRoutes);

export default router;