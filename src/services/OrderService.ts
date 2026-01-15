import { db } from '../config/firebase';
import { OrderModel } from '../models/Orders';
import { ProductModel } from '../models/Products';
import { CustomerInfo, Order, OrderItem, OrderStatus } from '../types/Order';
import { Product } from '../types/Product';
import { NotFoundError } from '../errors/NotFoundError';
import { ValidationError } from '../errors/ValidationError';
import logger from '../config/logger';

//configuracion de la reserva
const RESERVATION_DAYS = 3;

//Order service
export const OrderService = {
  async createOrder(
    customer: CustomerInfo,
    items: Array<{
      productId: string;
      size: string;
      color: string;
      quantity: number;
    }>,
    paymentMethod: string,
    customerId?: string,
  ): Promise<Order> {
    logger.info({
      message: 'Creating order',
      customerEmail: customer.email,
      itemCount: items.length,
    });

    const productData: Product[] = [];
    for (const item of items) {
      const product = await ProductModel.getById(item.productId);
      if (!product) {
        throw new NotFoundError('Product', item.productId);
      }

      const stockItem = product.stock.find(
        s => s.size === item.size && s.color === item.color
      );

      if (!stockItem) {
        throw new ValidationError(
          `Stock item not found for ${product.name} in size ${item.size} and color ${item.color}`,
          ['size', 'color']
        );
      }

      if (stockItem.quantity < item.quantity) {
        throw new ValidationError(
          `Not enough stock for ${product.name} in size ${item.size} and color ${item.color}. Available: ${stockItem.quantity}, Requested: ${item.quantity}`,
          ['quantity']
        );
      }

      productData.push(product);
    }

    //calculo el total
    const total = items.reduce((sum, item) => {
      const product = productData.find(p => p.id === item.productId)!;
      const price = product.discountPrice || product.price;
      return sum + (price * item.quantity);
    }, 0);

    //Creo items con la informacion completa
    const orderItems: OrderItem[] = items.map(item => {
      const product = productData.find(p => p.id === item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: product.discountPrice || product.price,
        reservedStock: true,
      };
    });

    //genero un numero de orden unico
    const orderNumber = `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    //calculo la fecha de expiracion de la reserva
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RESERVATION_DAYS);

    //reservo el stock con batch
    const batch = db.batch();

    //reservo stock (descontar)
    for(const item of items) {
      const product = await ProductModel.getById(item.productId);
      if(!product) throw new NotFoundError('Product', item.productId);

      const updatedStock = product.stock.map(stockItem => {
        if(stockItem.size === item.size && stockItem.color === item.color) {
          return {
            ...stockItem,
            quantity: stockItem.quantity - item.quantity,
          };
        }
        return stockItem;
      });
      const productRef = db.collection('products').doc(item.productId);
      batch.update(productRef, { stock: updatedStock });
    }

    //creo la orden
    const orderRef = db.collection('orders').doc();
    const orderData: any = {
      orderNumber: orderNumber.toString(),
      customer,
      items: orderItems,
      status: 'pending-payment' as OrderStatus,
      total,
      paymentMethod,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Solo agregar customerId si está definido
    if (customerId) {
      orderData.customerId = customerId;
    }
    
    batch.set(orderRef, orderData);

    //ejecuto todas las operaciones juntas con batch
    await batch.commit();

    //retorno la orden creada
    const doc = await orderRef.get();
    const orderResult: Order = {
      id: doc.id,
      orderNumber: orderData.orderNumber,
      customer: orderData.customer,
      items: orderData.items,
      status: orderData.status,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      expiresAt: orderData.expiresAt,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
    };
    
    // Solo agregar customerId si existe
    if (customerId) {
      orderResult.customerId = customerId;
    }
    
    logger.info({
      message: 'Order created successfully',
      orderId: orderResult.id,
      orderNumber: orderResult.orderNumber,
    });

    return orderResult;
  },

  //corfirmo el pago
  async confirmPayment(orderId: string, paymentId: string, paymentStatus: string = 'approved'): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'pending-payment') {
      throw new ValidationError(`Order ${orderId} is not pending payment`, ['status']);
    }

    return await OrderModel.confirmPayment(orderId, paymentId, paymentStatus);
  },

  //cancelar orden y devolver stock
  async cancelOrder(
    orderId: string,
    reason: 'manually-cancelled' | 'cancelled-by-time' = 'manually-cancelled'
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'pending-payment') {
      throw new ValidationError(`Only orders with status pending payment can be canceled`, ['status']);
    }

    //reponer stock con batch y modificar el estado
    const batch = db.batch();

    //reponer stock (aumentar)
    for (const item of order.items) {
      const product = await ProductModel.getById(item.productId);
      if(!product) continue;

      const updatedStock = product.stock.map(stockItem => {
        if (stockItem.size === item.size && stockItem.color == item.color) {
          return {
            ...stockItem,
            quantity: stockItem.quantity + item.quantity,
          };
        }
        return stockItem;
      });
      const productRef = db.collection('products').doc(item.productId);
      batch.update(productRef, { stock: updatedStock });
    }

    //cambio el estado de la orden
    const orderRef = db.collection('orders').doc(orderId);
    batch.update(orderRef, {
      status: reason,
      updatedAt: new Date(),
    });

    await batch.commit();

    return (await OrderModel.getById(orderId))!;
  },

  //marcar como entregado
  async markAsDelivered(orderId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'payment-confirmed') {
      throw new ValidationError(`Only orders with status payment confirmed can be marked as delivered`, ['status']);
    }

    return await OrderModel.markAsDelivered(orderId);
  },

  // Cancelar ordenes expiradas automaticamente
  async cancelExpiredOrders(): Promise<number> {
    const now = new Date();
    const expiredOrders = await OrderModel.getAll({
      status: 'pending-payment'
    });

    let cancelled = 0;
    for (const order of expiredOrders) {
      if (order.expiresAt && order.expiresAt < now) {
        await this.cancelOrder(order.id, 'cancelled-by-time');
        cancelled++;
      }
    }
    return cancelled;
  },

  //obtener orden por ID
  async getOrderById(id: string): Promise<Order> {
    const order = await OrderModel.getById(id);
    if(!order) {
      throw new NotFoundError('Order', id);
    }
    return order;
  },

  //obtengo orden por numero
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await OrderModel.getByOrderNumber(orderNumber);
    if(!order) {
      throw new NotFoundError('Order', orderNumber);
    }
    return order;
  },

  //obtengo orden por preferenceId
  async getOrderByPreferenceId(preferenceId: string): Promise<Order> {
    const order = await OrderModel.getByPreferenceId(preferenceId);
    if(!order) {
      throw new NotFoundError('Order', preferenceId);
    }
    return order;
  },

  //obtengo todas las ordenes
  async getAllOrders(filters?: {
    status?: OrderStatus;
    customerEmail?: string;
  }): Promise<Order[]> {
    return await OrderModel.getAll(filters);
  },

  //obtener ordenes por customer ID
  async getOrdersByCustomerEmail(customerEmail: string): Promise<Order[]> {
    return await OrderModel.getAll({ customerEmail });
  },

  //verifico ordenes proximas a expirar
  async getOrdersExpiringSoon(hours: number): Promise<Order[]> {
    const orders = await OrderModel.getAll({ status: 'pending-payment' });
    const now = new Date();
    const expirationThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return orders.filter(order => {
      if (!order.expiresAt) return false;
      return order.expiresAt <= expirationThreshold;
    });
  },

  //actualizar preferenceId de una orden
  async updateOrderPreferenceId(orderId: string, preferenceId: string): Promise<Order> {
    return await OrderModel.update(orderId, { preferenceId });
  },
}