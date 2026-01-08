import { Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { AuthenticatedRequest } from "../middleware/auth";
import { OrderStatus } from "../types/";
import { PaymentService } from "../services/PaymentService";

export const orderController = {
  //Crear orden POST (public)
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { customer, items, paymentMethod } = req.body;

      if(!customer || !items || !paymentMethod) {
        return res.status(400).json({
          error: 'Customer, items and payment method are required'
        });
      }

      if(!customer.name || !customer.email || !customer.phone) {
        return res.status(400).json({
          error: 'Customer name, email and phone are required'
        });
      }

      if(!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Items must be an array and must contain at least one item'
        });
      }

      //validar items
      for (const item of items) {
        if(!item.productId || !item.size || !item.color || !item.quantity) {
          return res.status(400).json({
            error: 'Each item must have a productId, size, color and quantity'
          });
        }

        if(item.quantity <= 0) {
          return res.status(400).json({
            error: 'Quantity must be greater than 0'
          });
        }
      }

      const customerId = req.user && req.user.role === 'customer' 
        ? req.user.id 
        : undefined;

      const order = await OrderService.createOrder(
        customer,
        items,
        paymentMethod,
        customerId  
      );

      if (paymentMethod === 'mercadopago') {
        try {
          const { paymentUrl, preferenceId } = await PaymentService.createPaymentPreference(order);
          
          // Actualizar la orden con el preferenceId si es necesario
          // (esto se puede hacer después si queremos guardarlo en la BD)
          
          return res.status(201).json({
            message: 'Order created successfully',
            order: {
              ...order,
              preferenceId, // ID de la preferencia de Mercado Pago
            },
            paymentUrl, // URL para que el cliente redirija y pague
            preferenceId, // ID de la preferencia para referencia futura
          });
        } catch (paymentError: any) {
          // Si falla crear la preferencia, aún así retornamos la orden
          // (el admin puede crear el pago manualmente después)
          return res.status(201).json({
            message: 'Order created successfully, but payment URL could not be generated',
            order,
            error: paymentError.message,
          });
        }
      }

      return res.status(201).json({ message: 'Order created successfully', order });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Stock') 
                         ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //GET obtener order por numero de orden (public)
  async getOrderByNumber(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;

      if(!orderNumber) {
        return res.status(400).json({
          error: 'Order number is required'
        });
      }

      const order = await OrderService.getOrderByNumber(orderNumber);

      return res.status(200).json({
        message: 'Order fetched successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //GET obtener todas las ordenes (Admin)
  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, customerEmail } = req.query;

      const filters: { status?: OrderStatus; customerEmail?: string } = {};

      if(status) {
        filters.status = status as OrderStatus;
      }

      if(customerEmail) {
        filters.customerEmail = customerEmail as string;
      }

      const orders = await OrderService.getAllOrders(filters);
      return res.status(200).json({
        message: 'Orders fetched successfully',
        orders,
        count: orders.length,
      })
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
       });
    }
  },

  //Get obtener orden por id (Admin)
  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      if(!id) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }
      const order = await OrderService.getOrderById(id as string);
      return res.status(200).json({
        message: 'Order fetched successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //post cancelar orden (public)
  async cancelOrder(req:Request, res: Response) {
    try {
      const { orderId } = req.body;

      if(!orderId) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }

      const order = await OrderService.cancelOrder(orderId as string);
      return res.status(200).json({
        message: 'Order cancelled successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Only orders with status pending payment can be canceled') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //Post para marcar orden como entregada (Admin)
  async markAsDelivered(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.body;

      if(!orderId) {
        return res.status(400).json({error: ' order ID is required'})
      }

      const order = await OrderService.markAsDelivered(orderId as string);
      return res.status(200).json({
        message: 'Order marked as delivered successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Only orders with status payment confirmed can be marked as delivered') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //Get de las ordenes proximas a expirar (Admin)
  async getOrdersExpiringSoon(req: AuthenticatedRequest, res: Response) {
    try {
      const { hours } = req.query;
      const hoursNumber = hours ? parseInt(hours as string, 10) : 24;

      if(isNaN(hoursNumber) || hoursNumber <= 0) {
        return res.status(400).json({error: 'Hours must be a positive number'});
      }

      const orders = await OrderService.getOrdersExpiringSoon(hoursNumber);
      return res.status(200).json({
        message: 'Orders expiring soon fetched successfully',
        orders,
        count: orders.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },

   // POST - Confirmar pago (PÚBLICO)
   async confirmPayment(req: Request, res: Response) {
    try {
      const { orderId, paymentId } = req.body;

      if (!orderId || !paymentId) {
        return res.status(400).json({ 
          error: 'orderId and paymentId are required' 
        });
      }

      const order = await OrderService.confirmPayment(orderId, paymentId);

      return res.status(200).json({
        message: 'Payment confirmed successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('not pending') 
                        ? 400 : 500;

      return res.status(statusCode).json({ error: error.message });
    }
  },

  // POST - Webhook de Mercado Pago (notificaciones automáticas)
  async handleWebhook(req: Request, res: Response) {
    try {
      const { type, data } = req.body;

      // Mercado Pago puede enviar diferentes tipos de notificaciones
      if (type === 'payment') {
        const paymentId = data?.id;

        if (!paymentId) {
          // Si no hay paymentId, responder OK pero no procesar
          return res.status(200).json({ received: true, message: 'No payment ID provided' });
        }

        try {
          // Obtener información completa del pago usando el nuevo método
          const paymentInfo = await PaymentService.getPaymentInfo(paymentId.toString());

          const orderId = paymentInfo.externalReference;

          if (!orderId) {
            // Si no hay orderId, responder OK pero no procesar
            return res.status(200).json({ received: true, message: 'No order ID found in payment' });
          }

          // Procesar según el estado del pago
          const status = paymentInfo.status;

          if (status === 'approved') {
            // Pago aprobado - confirmar orden
            await OrderService.confirmPayment(orderId, paymentId.toString(), 'approved');
          } else if (status === 'rejected' || status === 'cancelled') {
            // Pago rechazado o cancelado - cancelar orden y devolver stock
            await OrderService.cancelOrder(orderId, 'manually-cancelled');
          }
          // Si el estado es 'pending', no hacemos nada (la orden ya está en pending-payment)
        } catch (paymentError: any) {
          // Si hay error al obtener el pago, responder OK para evitar reenvíos
          // pero no procesar la notificación
          return res.status(200).json({ 
            received: true, 
            error: `Failed to process payment: ${paymentError.message}` 
          });
        }
      } else if (type === 'merchant_order') {
        // Mercado Pago también puede enviar notificaciones de merchant_order
        // Por ahora solo respondemos OK, pero se puede implementar lógica adicional
        return res.status(200).json({ received: true, message: 'Merchant order notification received' });
      }

      // Siempre responder 200 a Mercado Pago (importante)
      // Si respondes error, Mercado Pago seguirá reenviando la notificación
      return res.status(200).json({ received: true });
    } catch (error: any) {
      // Aún así responder 200 para evitar reenvíos infinitos
      return res.status(200).json({ received: true, error: 'Webhook processing error' });
    }
  },

  // GET/POST - Procesar retorno desde Mercado Pago y verificar estado del pago
  async handlePaymentReturn(req: Request, res: Response) {
    try {
      // Mercado Pago puede enviar payment_id, collection_id, status, preference_id
      // Puede venir en query params (GET) o en body (POST)
      const queryParams = req.query || {};
      const bodyParams = req.body || {};
      
      // Combinar query params y body params (body tiene prioridad)
      const params = { ...queryParams, ...bodyParams };
      
      const { payment_id, collection_id, status, preference_id } = params;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const baseFrontendUrl = frontendUrl.replace(/\/$/, '');

      // Determinar el ID del pago (payment_id o collection_id son equivalentes)
      const paymentId = (payment_id || collection_id)?.toString();

      if (!paymentId && !preference_id) {
        // Si no hay información del pago, redirigir al frontend con error
        return res.redirect(`${baseFrontendUrl}/order/error?message=No payment information provided`);
      }

      try {
        let orderId: string | undefined;
        let paymentStatus: string | undefined;

        if (paymentId) {
          // Si tenemos el payment_id, obtener información del pago directamente
          const paymentInfo = await PaymentService.getPaymentInfo(paymentId);
          
          orderId = paymentInfo.externalReference;
          paymentStatus = paymentInfo.status;

          // Actualizar el estado de la orden según el estado del pago
          if (orderId) {
            if (paymentStatus === 'approved') {
              // Verificar que la orden aún esté pendiente antes de confirmar
              try {
                const order = await OrderService.getOrderById(orderId);
                
                if (order.status === 'pending-payment') {
                  await OrderService.confirmPayment(orderId, paymentId, 'approved');
                }
              } catch (orderError: any) {
                // Si la orden ya fue procesada, continuar con la redirección
              }
            } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
              // Cancelar orden si el pago fue rechazado
              try {
                const order = await OrderService.getOrderById(orderId);
                if (order.status === 'pending-payment') {
                  await OrderService.cancelOrder(orderId, 'manually-cancelled');
                }
              } catch (orderError: any) {
                // Continuar con la redirección aunque haya error
              }
            }
          }
        } else if (preference_id) {
          // Si solo tenemos preference_id, buscar la orden por preferenceId
          try {
            const order = await OrderService.getOrderByPreferenceId(preference_id.toString());
            orderId = order.id;
            
            // Si la orden ya tiene paymentId, verificar su estado
            if (order.paymentId) {
              const paymentInfo = await PaymentService.getPaymentInfo(order.paymentId);
              paymentStatus = paymentInfo.status;
              
              // Actualizar estado si es necesario
              if (paymentStatus === 'approved' && order.status === 'pending-payment') {
                await OrderService.confirmPayment(orderId, order.paymentId, 'approved');
              }
            } else {
              // Si no hay paymentId aún, el pago puede estar pendiente
              paymentStatus = 'pending';
            }
          } catch (prefError: any) {
            return res.redirect(`${baseFrontendUrl}/order/error?message=Order not found for preference`);
          }
        }

        // Redirigir al frontend según el estado
        if (!orderId) {
          return res.redirect(`${baseFrontendUrl}/order/error?message=Order not found`);
        }

        // Determinar la URL de redirección según el estado
        let redirectUrl: string;
        if (paymentStatus === 'approved') {
          redirectUrl = `${baseFrontendUrl}/order/${orderId}?status=success`;
        } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
          redirectUrl = `${baseFrontendUrl}/order/${orderId}?status=failure`;
        } else {
          // Estado pending u otro
          redirectUrl = `${baseFrontendUrl}/order/${orderId}?status=pending`;
        }
        
        return res.redirect(redirectUrl);
      } catch (paymentError: any) {
        // Si hay error al obtener el pago, redirigir con error
        return res.redirect(`${baseFrontendUrl}/order/error?message=Error processing payment`);
      }
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const baseFrontendUrl = frontendUrl.replace(/\/$/, '');
      return res.redirect(`${baseFrontendUrl}/order/error?message=Unexpected error`);
    }
  },

  // GET - Obtener estado de pago de una orden (público)
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }

      // Obtener la orden
      const order = await OrderService.getOrderById(orderId);

      if (!order.paymentId) {
        return res.status(200).json({
          orderId: order.id,
          paymentStatus: 'no-payment',
          message: 'No payment has been processed for this order',
        });
      }

      try {
        // Obtener información actualizada del pago desde Mercado Pago
        const paymentInfo = await PaymentService.getPaymentInfo(order.paymentId);

        return res.status(200).json({
          orderId: order.id,
          orderStatus: order.status,
          paymentId: paymentInfo.id,
          paymentStatus: paymentInfo.status,
          paymentStatusDetail: paymentInfo.statusDetail,
          transactionAmount: paymentInfo.transactionAmount,
          dateCreated: paymentInfo.dateCreated,
          dateApproved: paymentInfo.dateApproved,
        });
      } catch (paymentError: any) {
        // Si hay error al obtener el pago, retornar información de la orden
        return res.status(200).json({
          orderId: order.id,
          orderStatus: order.status,
          paymentId: order.paymentId,
          paymentStatus: order.paymentStatus || 'unknown',
          error: `Could not fetch updated payment status: ${paymentError.message}`,
        });
      }
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({ 
        error: error.message 
      });
    }
  }
}