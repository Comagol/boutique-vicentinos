import { db } from '../config/firebase';
import { OrderModel } from '../models/Orders';
import { ProductModel } from '../models/Products';
import { CustomerInfo, Order, OrderItem, OrderStatus } from '../types/Order';
import { Product } from '../types/Product';

//configuracion de la reserva
const RESERVATION_DAYS = 3;

//Order service
export const OrderService = {
  //CREAR orden con reserva de stock
  async createOrder(
    customer: CustomerInfo,
    items: Array<{
      productId: string;
      size: string;
      color: string;
      quantity: number;
    }>,
    paymentMethod: string,
  ): Promise<Order> {
    //validar si el stock esta disponible
    const productData: Product[] = [];
    for (const item of items) {
      const product = await ProductModel.getById(item.productId);
      if(!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      //valido el stock
      const stockItem = product.stock.find(
        s => s.size === item.size && s.color === item.color
      );

      if(!stockItem) {
        throw new Error(`Stock item not found for the ${product.name} in size ${item.size} and color ${item.color}`)
      }

      if(stockItem.quantity < item.quantity) {
        throw new Error(`Not enough stock for the ${product.name} in size ${item.size} and color ${item.color}`)
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
    const orderNumber = await this.generateOrderNumber();

    //calculo la fecha de expiracion de la reserva
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RESERVATION_DAYS);

    //reservo el stock con batch
    const batch = db.batch();

    //reservo stock (descontar)
    for(const item of items) {
      const product = await ProductModel.getById(item.productId);
      if(!product) throw new Error(`Product ${item.productId} not found`);

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
    const orderData = {
      orderNumber,
      customer,
      items: orderItems,
      status: 'pending-payment' as OrderStatus,
      total,
      paymentMethod,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    batch.set(orderRef, orderData);

    //ejecuto todas las operaciones juntas con batch
    await batch.commit();

    //retorno la orden creada
    const doc = await orderRef.get();
    return {
      id: doc.id,
      ...orderData,
    };
  },

  //corfirmo el pago
  async confirmPayment(orderId: string, paymentId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'pending-payment') {
      throw new Error(`Order ${orderId} is not pending payment`);
    }

    return await OrderModel.confirmPayment(orderId, paymentId);
  },

  //cancelar orden y devolver stock
  async cancelOrder(
    orderId: string,
    reason: 'manually-cancelled' | 'cancelled-by-time' = 'manually-cancelled'
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'pending-payment') {
      throw new Error(`Only orders with status pending payment can be canceled`);
    }

    //reponer stock con batch y modificar el estado
    const batch = db.batch();

    //reponer stock (aumentar)
    
  }
}