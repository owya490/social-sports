import { TicketTypeData } from "@/interfaces/TicketTypeTypes";
import { doc, setDoc } from "firebase/firestore";
import { eventServiceLogger } from "../events/eventsService";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";

export async function addTicketTypeToEvent(eventId: string, ticketType: TicketTypeData): Promise<void> {
  try {
    const eventDocSnapshot = await findEventDoc(eventId);
    const eventDocRef = eventDocSnapshot.ref;
    const ticketTypeDocRef = doc(eventDocRef, "TicketTypes", ticketType.id);

    await setDoc(ticketTypeDocRef, ticketType);

    eventServiceLogger.info(`Added ticket type '${ticketType}' to event '${eventId}'`);
  } catch (error) {
    eventServiceLogger.error(`Failed to add ticket type to event ${eventId}: ${error}`);
    throw error;
  }
}

export async function addDefaultTicketTypes(eventId: string, capacity: number, price: number) {
  const DEFAULT_TICKET_TYPES = [
    {
      id: "Admin",
      name: "Admin",
      price: 0,
      availableQuantity: Number.MAX_SAFE_INTEGER,
      soldQuantity: 0,
    },
    {
      id: "General",
      name: "General",
      price: 20,
      availableQuantity: capacity,
      soldQuantity: 0,
    },
  ];
  for (const ticketType of DEFAULT_TICKET_TYPES) {
    await addTicketTypeToEvent(eventId, ticketType);
  }
}
