import { OrderId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export async function calculateNetSales(orderTicketsMap: Map<Order, Ticket[]>): Promise<number> {
  const orderResults = Array.from(orderTicketsMap.keys()).map((order) => {
    const tickets = orderTicketsMap.get(order);
    const ticketSales = tickets?.reduce((sum, ticket) => sum + ticket.price, 0) ?? 0;
    return { ticketSales, discounts: order.discounts };
  });

  const totalTicketSales = orderResults.reduce((sum, result) => sum + result.ticketSales, 0);
  const totalDiscounts = orderResults.reduce((sum, result) => sum + result.discounts, 0);

  return totalTicketSales - totalDiscounts;
}


export function getEntryFromOrderTicketsMapByOrderId(orderTicketsMap: Map<Order, Ticket[]>, orderId: OrderId): [Order, Ticket[]] | undefined {
  return Array.from(orderTicketsMap.entries()).find(([order]) => order.orderId === orderId) ?? undefined;
}