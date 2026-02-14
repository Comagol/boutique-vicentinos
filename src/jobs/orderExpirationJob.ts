import { OrderService } from '../services/OrderService';
import logger from '../config/logger';

const DEFAULT_INTERVAL_MINUTES = 15;
const MIN_INTERVAL_MINUTES = 1;

const getJobIntervalMs = (): number => {
  const rawValue = process.env.ORDER_EXPIRATION_JOB_INTERVAL_MINUTES;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_INTERVAL_MINUTES;
  const safeMinutes = Number.isFinite(parsedValue) && parsedValue >= MIN_INTERVAL_MINUTES
    ? parsedValue
    : DEFAULT_INTERVAL_MINUTES;
  return safeMinutes * 60 * 1000;
};

const runExpirationCycle = async (): Promise<void> => {
  try {
    const cancelledOrders = await OrderService.cancelExpiredOrders();
    if (cancelledOrders > 0) {
      logger.info({
        message: 'Expired pending-payment orders cancelled successfully',
        cancelledOrders,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({
      message: `Order expiration job failed: ${errorMessage}`,
      error: errorMessage,
    });
  }
};

export const startOrderExpirationJob = (): NodeJS.Timeout => {
  const intervalMs = getJobIntervalMs();

  // Ejecutar una vez al iniciar para limpiar órdenes vencidas previas
  void runExpirationCycle();

  logger.info({
    message: 'Order expiration job started',
    intervalMinutes: intervalMs / 60000,
  });

  const timer = setInterval(() => {
    void runExpirationCycle();
  }, intervalMs);

  return timer;
};
