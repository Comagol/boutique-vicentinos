import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ======== PUBLIC ROUTES ==========
//Get all products /api/products (PUBLIC)
router.get('/', productController.getAllProducts);

//Get product by id /api/products/:id (PUBLIC)
router.get('/:id', productController.getProductById);

// ======== ADMIN ROUTES ==========

router.use(authenticate, requireAdmin);

//Get all products including deactivated /api/products/admin/all (ADMIN)
router.get('/admin/all', productController.getAllProductsAdmin);

//Post create product /api/products (ADMIN)
router.post('/', productController.createProduct);

//Put update product /api/products/:id (ADMIN)
router.put('/:id', productController.updateProduct);

//Delete product /api/products/:id (ADMIN)
router.delete('/:id', productController.deleteProduct);

//Deactivate product /api/products/:id/deactivate (ADMIN)
router.post('/:id/deactivate', productController.deactivateProduct);

//Activate product /api/products/:id/activate (ADMIN)
router.post('/:id/activate', productController.activateProduct);