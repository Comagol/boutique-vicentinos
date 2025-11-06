import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ======== RUTAS PUBLICAS ==========
//Get all products /api/products (PUBLIC)
router.get('/', productController.getAllProducts);

//Get product by id /api/products/:id (PUBLIC)
router.get('/:id', productController.getProductById);