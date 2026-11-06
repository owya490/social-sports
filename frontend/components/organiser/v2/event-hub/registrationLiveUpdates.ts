import { OrderId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";

export type RegistrationUpdateIssue = "listener" | "sync" | null;

export async function loadRegistrationData(
  orderIds: readonly OrderId[]
): Promise<{ allOrders: Order[]; orderTicketsMap: Map<Order, Ticket[]> }> {
  const allOrders = await getOrdersByIds([...orderIds]);
  const allTickets = await getTicketsByIds(allOrders.flatMap((order) => order.tickets));
  const ticketsByOrderId = new Map<OrderId, Ticket[]>();

  allTickets.forEach((ticket) => {
    const tickets = ticketsByOrderId.get(ticket.orderId) ?? [];
    tickets.push(ticket);
    ticketsByOrderId.set(ticket.orderId, tickets);
  });

  return {
    allOrders,
    orderTicketsMap: new Map(
      allOrders.map((order) => [order, ticketsByOrderId.get(order.orderId) ?? []])
    ),
  };
}

export function mergeOrderTicketsByOrderId(
  current: Map<Order, Ticket[]>,
  additions: Map<Order, Ticket[]>
): Map<Order, Ticket[]> {
  const next = new Map(current);
  additions.forEach((tickets, addedOrder) => {
    for (const existingOrder of next.keys()) {
      if (existingOrder.orderId === addedOrder.orderId) next.delete(existingOrder);
    }
    next.set(addedOrder, tickets);
  });
  return next;
}
