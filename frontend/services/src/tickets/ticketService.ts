import { TicketId } from "@/interfaces/EventTypes";
import { EMPTY_TICKET, Ticket, TicketsCollectionPath } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { doc, getDoc } from "firebase/firestore";

const ticketServiceLogger = new Logger("ticketServiceLogger");

export async function getTicketById(ticketId: TicketId): Promise<Ticket> {
  ticketServiceLogger.info(`getTicketById, ${ticketId}`);
  try {
    const ticket = await getDoc(doc(db, TicketsCollectionPath, ticketId));
    if (!ticket.exists()) {
      ticketServiceLogger.error(`getTicketById, ticket not found, ${ticketId}`);
      throw new Error(`Ticket not found, ${ticketId}`);
    }
    const ticketData = ticket.data() as Ticket;
    return { ...EMPTY_TICKET, ...ticketData, ticketId: ticketId };
  } catch (error) {
    ticketServiceLogger.error(`getTicketById ${error}`);
    throw error;
  }
}
