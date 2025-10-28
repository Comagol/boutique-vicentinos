import { db } from '../config/firebase';
import { OrderModel } from '../models/Orders';
import { ProductModel } from '../models/Products';
import { CustomerInfo, Order, OrderItem } from '../types/Order';
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
  }
}