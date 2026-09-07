import { EventId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_TICKET, Ticket, TicketsCollectionPath } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { db } from "@/services/src/firebase";
import { chunkForInQuery } from "@/services/src/firebase/firestoreQueryUtils";
import { filterTicketsPurchasedOnOrAfter } from "@/services/src/organiser/organiserLookback";
import { collection, doc, documentId, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";

const ticketServiceLogger = new Logger("ticketServiceLogger");

function ticketFromDoc(ticketId: TicketId, data: Ticket): Ticket {
  return { ...EMPTY_TICKET, ...data, ticketId };
}

export async function getTicketById(ticketId: TicketId): Promise<Ticket> {
  ticketServiceLogger.info(`getTicketById, ${ticketId}`);
  try {
    const ticket = await getDoc(doc(db, TicketsCollectionPath, ticketId));
    if (!ticket.exists()) {
      ticketServiceLogger.error(`getTicketById, ticket not found, ${ticketId}`);
      throw new Error(`Ticket not found, ${ticketId}`);
    }
    return ticketFromDoc(ticketId, ticket.data() as Ticket);
  } catch (error) {
    ticketServiceLogger.error(`getTicketById ${error}`);
    throw error;
  }
}

async function queryTicketsByIds(ticketIds: TicketId[]): Promise<Ticket[]> {
  const chunks = chunkForInQuery(ticketIds);
  if (chunks.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, TicketsCollectionPath), where(documentId(), "in", chunk)))
    )
  );

  const tickets: Ticket[] = [];
  for (const snapshot of snapshots) {
    snapshot.forEach((ticketDoc) => {
      tickets.push(ticketFromDoc(ticketDoc.id as TicketId, ticketDoc.data() as Ticket));
    });
  }
  return tickets;
}

export async function getTicketsByIds(ticketIds: TicketId[]): Promise<Ticket[]> {
  ticketServiceLogger.info(`getTicketsByIds, ${ticketIds.length}`);
  try {
    const uniqueIds = [...new Set(ticketIds)];
    const tickets = await queryTicketsByIds(uniqueIds);
    const byId = new Map(tickets.map((ticket) => [ticket.ticketId, ticket]));
    return uniqueIds.map((ticketId) => {
      const ticket = byId.get(ticketId);
      if (!ticket) {
        ticketServiceLogger.error(`getTicketById, ticket not found, ${ticketId}`);
        throw new Error(`Ticket not found, ${ticketId}`);
      }
      return ticket;
    });
  } catch (error) {
    ticketServiceLogger.error(`getTicketsByIds ${error}`);
    throw error;
  }
}

/**
 * Tickets for the given events, keeping those purchased on/after `purchasedOnOrAfter`.
 * Queries by eventId only (single-field `in`) and applies the date cut in memory.
 */
export async function getTicketsPurchasedOnOrAfter(
  eventIds: EventId[],
  purchasedOnOrAfter: Timestamp
): Promise<Ticket[]> {
  ticketServiceLogger.info(
    `getTicketsPurchasedOnOrAfter, events=${eventIds.length}, since=${purchasedOnOrAfter.seconds}`
  );
  try {
    const chunks = chunkForInQuery(eventIds);
    if (chunks.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, TicketsCollectionPath), where("eventId", "in", chunk)))
      )
    );

    const tickets: Ticket[] = [];
    for (const snapshot of snapshots) {
      snapshot.forEach((ticketDoc) => {
        tickets.push(ticketFromDoc(ticketDoc.id as TicketId, ticketDoc.data() as Ticket));
      });
    }
    const recentTickets = filterTicketsPurchasedOnOrAfter(tickets, purchasedOnOrAfter);
    ticketServiceLogger.info(
      `getTicketsPurchasedOnOrAfter returned ${recentTickets.length} of ${tickets.length} tickets`
    );
    return recentTickets;
  } catch (error) {
    ticketServiceLogger.error(`getTicketsPurchasedOnOrAfter ${error}`);
    throw error;
  }
}
