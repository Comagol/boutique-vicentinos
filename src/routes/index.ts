import { Router } from "express";
import authRoutes from "./authRoutes";
import productRoutes from "./productRoutes";
import orderRoutes from "./orderRoutes";
import paymentRoutes from "./paymentRoutes";

const router = Router();

//montar todas las rutas
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

export default router;