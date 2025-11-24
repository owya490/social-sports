import { TicketId } from "@/interfaces/EventTypes";
import { EMPTY_TICKET, Ticket, TicketCollectionPath } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { doc, getDoc } from "firebase/firestore";

const ticketServiceLogger = new Logger("ticketServiceLogger");

export async function getTicketById(ticketId: TicketId): Promise<Ticket> {
  ticketServiceLogger.info(`getTicketById, ${ticketId}`);
  try {
    const ticket = await getDoc(doc(db, TicketCollectionPath, ticketId));
    const ticketData = ticket.data() as Ticket;
    return { ...EMPTY_TICKET, ...ticketData, ticketId: ticketId };
  } catch (error) {
    ticketServiceLogger.error(`getTicketById ${error}`);
    throw error;
  }
}
