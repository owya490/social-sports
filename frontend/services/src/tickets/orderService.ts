import { OrderId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER, Order, OrderCollectionPath } from "@/interfaces/OrderTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { doc, getDoc } from "firebase/firestore";

const orderServiceLogger = new Logger("orderServiceLogger");

export async function getOrderById(orderId: OrderId): Promise<Order> {
  orderServiceLogger.info(`getOrderById, ${orderId}`);
  try {
    const order = await getDoc(doc(db, OrderCollectionPath, orderId));
    const orderData = order.data() as Order;
    return { ...EMPTY_ORDER, ...orderData, orderId: orderId };
  } catch (error) {
    orderServiceLogger.error(`getOrderById ${error}`);
    throw error;
  }
}
