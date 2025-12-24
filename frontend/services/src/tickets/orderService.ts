import { OrderId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER, Order, OrdersCollectionPath } from "@/interfaces/OrderTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { doc, getDoc } from "firebase/firestore";

const orderServiceLogger = new Logger("orderServiceLogger");

export async function getOrderById(orderId: OrderId): Promise<Order> {
  orderServiceLogger.info(`getOrderById, ${orderId}`);
  try {
    const order = await getDoc(doc(db, OrdersCollectionPath, orderId));
    if (!order.exists()) {
      orderServiceLogger.error(`getOrderById, order not found, ${orderId}`);
      throw new Error(`Order not found, ${orderId}`);
    }
    const orderData = order.data() as Order;
    return { ...EMPTY_ORDER, ...orderData, orderId: orderId };
  } catch (error) {
    orderServiceLogger.error(`getOrderById ${error}`);
    throw error;
  }
}

export async function getOrdersByIds(orderIds: OrderId[]): Promise<Order[]> {
  orderServiceLogger.info(`getOrdersByIds, ${orderIds}`);
  try {
    const orders = await Promise.all(orderIds.map((orderId) => getOrderById(orderId)));
    return orders;
  } catch (error) {
    orderServiceLogger.error(`getOrdersByIds ${error}`);
    throw error;
  }
}
