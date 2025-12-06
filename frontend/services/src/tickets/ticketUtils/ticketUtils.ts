import { EventMetadata } from "@/interfaces/EventTypes";
import { getOrderById } from "../orderService";
import { getTicketById } from "../ticketService";

export async function calculateNetSales(eventMetadata: EventMetadata): Promise<number> {
  const orderResults = await Promise.all(
    eventMetadata.orderIds.map(async (orderId) => {
      const order = await getOrderById(orderId);
      const ticketPrices = await Promise.all(
        order.tickets.map(async (ticketId) => {
          const ticketData = await getTicketById(ticketId);
          return ticketData.price;
        })
      );
      const ticketSales = ticketPrices.reduce((sum, price) => sum + price, 0);
      return { ticketSales, discounts: order.discounts };
    })
  );

  const totalTicketSales = orderResults.reduce((sum, result) => sum + result.ticketSales, 0);
  const totalDiscounts = orderResults.reduce((sum, result) => sum + result.discounts, 0);

  return totalTicketSales - totalDiscounts;
}
