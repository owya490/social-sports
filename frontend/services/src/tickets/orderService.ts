import { OrderId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrdersCollectionPath } from "@/interfaces/OrderTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { chunkForInQuery } from "@/services/src/firebase/firestoreQueryUtils";
import { collection, doc, documentId, getDoc, getDocs, query, where } from "firebase/firestore";

const orderServiceLogger = new Logger("orderServiceLogger");

function orderFromDoc(orderId: OrderId, data: Order): Order {
  return { ...EMPTY_ORDER_DEFAULTS, ...data, orderId };
}

export async function getOrderById(orderId: OrderId): Promise<Order> {
  orderServiceLogger.info(`getOrderById, ${orderId}`);
  try {
    const order = await getDoc(doc(db, OrdersCollectionPath, orderId));
    if (!order.exists()) {
      orderServiceLogger.error(`getOrderById, order not found, ${orderId}`);
      throw new Error(`Order not found, ${orderId}`);
    }
    return orderFromDoc(orderId, order.data() as Order);
  } catch (error) {
    orderServiceLogger.error(`getOrderById ${error}`);
    throw error;
  }
}

async function queryOrdersByIds(orderIds: OrderId[]): Promise<Order[]> {
  const chunks = chunkForInQuery(orderIds);
  if (chunks.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, OrdersCollectionPath), where(documentId(), "in", chunk)))
    )
  );

  const orders: Order[] = [];
  for (const snapshot of snapshots) {
    snapshot.forEach((orderDoc) => {
      orders.push(orderFromDoc(orderDoc.id as OrderId, orderDoc.data() as Order));
    });
  }
  return orders;
}

export async function getOrdersByIdsIfPresent(orderIds: OrderId[]): Promise<Order[]> {
  orderServiceLogger.info(`getOrdersByIdsIfPresent, ${orderIds.length}`);
  try {
    return await queryOrdersByIds(orderIds);
  } catch (error) {
    orderServiceLogger.error(`getOrdersByIdsIfPresent ${error}`);
    throw error;
  }
}

export async function getOrdersByIds(orderIds: OrderId[]): Promise<Order[]> {
  orderServiceLogger.info(`getOrdersByIds, ${orderIds.length}`);
  try {
    const uniqueIds = [...new Set(orderIds)];
    const orders = await queryOrdersByIds(uniqueIds);
    const byId = new Map(orders.map((order) => [order.orderId, order]));
    return uniqueIds.map((orderId) => {
      const order = byId.get(orderId);
      if (!order) {
        orderServiceLogger.error(`getOrderById, order not found, ${orderId}`);
        throw new Error(`Order not found, ${orderId}`);
      }
      return order;
    });
  } catch (error) {
    orderServiceLogger.error(`getOrdersByIds ${error}`);
    throw error;
  }
}
