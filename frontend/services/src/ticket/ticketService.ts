import { TicketTypeData } from "@/interfaces/TicketTypes";
import { doc, setDoc, collection, getDocs, updateDoc, increment, getDoc, runTransaction } from "firebase/firestore";
import { eventServiceLogger } from "../events/eventsService";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";
import { db } from "../firebase";
import {
  getFirebaseFunctionByName,
  FIREBASE_FUNCTIONS_PROCESS_TICKET_TYPES_PURCHASE,
} from "../firebaseFunctionsService";
import { TICKET_TYPE_IDS, TICKET_TYPE_DEFAULTS } from "./ticketConstants";

// Internal function for adding default ticket types only
async function addTicketTypeToEvent(eventId: string, ticketType: TicketTypeData): Promise<void> {
  try {
    const eventDocSnapshot = await findEventDoc(eventId);
    const eventDocRef = eventDocSnapshot.ref;
    const ticketTypeDocRef = doc(eventDocRef, "TicketTypes", ticketType.id);

    await setDoc(ticketTypeDocRef, ticketType);

    eventServiceLogger.info(`Added ticket type '${ticketType.name}' to event '${eventId}'`);
  } catch (error) {
    eventServiceLogger.error(`Failed to add ticket type to event ${eventId}: ${error}`);
    throw error;
  }
}

export async function getTicketTypesForEvent(eventId: string): Promise<TicketTypeData[]> {
  try {
    const eventDocSnapshot = await findEventDoc(eventId);
    const eventDocRef = eventDocSnapshot.ref;
    const ticketTypesCollection = collection(eventDocRef, "TicketTypes");

    const ticketTypesSnapshot = await getDocs(ticketTypesCollection);
    const ticketTypes: TicketTypeData[] = [];

    ticketTypesSnapshot.forEach((doc) => {
      ticketTypes.push(doc.data() as TicketTypeData);
    });

    return ticketTypes;
  } catch (error) {
    eventServiceLogger.error(`Failed to get ticket types for event ${eventId}: ${error}`);
    return [];
  }
}

// Ticket sold quantity updates are handled by backend webhook processing
// This function is kept for backward compatibility but should not be used

// Admin ticket usage is handled by backend webhook processing
// This function is kept for backward compatibility but should not be used

export async function addDefaultTicketTypes(eventId: string, capacity: number, price: number) {
  const DEFAULT_TICKET_TYPES = [
    {
      ...TICKET_TYPE_DEFAULTS[TICKET_TYPE_IDS.ADMIN],
    },
    {
      ...TICKET_TYPE_DEFAULTS[TICKET_TYPE_IDS.GENERAL],
      price: price,
      availableQuantity: capacity,
    },
  ];
  for (const ticketType of DEFAULT_TICKET_TYPES) {
    await addTicketTypeToEvent(eventId, ticketType);
  }
}

// All new events automatically get TicketTypes - no need for manual enabling

/**
 * Calculate total event vacancy based on all ticket types' available quantities
 * This provides the same functionality as the old event.vacancy field but from TicketTypes
 * For rollback compatibility, this matches the backend calculation
 */
export async function calculateEventVacancy(eventId: string): Promise<number> {
  try {
    const ticketTypes = await getTicketTypesForEvent(eventId);

    // Sum up available quantities from all ticket types (same logic as backend)
    const totalVacancy = ticketTypes.reduce((total, ticketType) => {
      return total + (ticketType.availableQuantity || 0);
    }, 0);

    return totalVacancy;
  } catch (error) {
    eventServiceLogger.error(`Failed to calculate event vacancy for ${eventId}: ${error}`);
    return 0;
  }
}

/**
 * Get the primary ticket type (General) available quantity
 * This is used for consistency with backend vacancy calculations
 */
export async function getGeneralTicketAvailability(eventId: string): Promise<number> {
  try {
    const ticketTypes = await getTicketTypesForEvent(eventId);
    const generalTicket = ticketTypes.find((ticket) => ticket.id === TICKET_TYPE_IDS.GENERAL);

    return generalTicket?.availableQuantity || 0;
  } catch (error) {
    eventServiceLogger.error(`Failed to get general ticket availability for ${eventId}: ${error}`);
    return 0;
  }
}

/**
 * Process a TicketTypes-based purchase using the backend function
 * This replaces the webhook-based processing for events with TicketTypes
 */
export async function processTicketTypesPurchase(
  eventId: string,
  quantity: number,
  customerDetails: { email: string },
  fullName: string,
  phoneNumber: string,
  isPrivate: boolean,
  checkoutSessionId: string
): Promise<boolean> {
  try {
    const processPurchaseFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_PROCESS_TICKET_TYPES_PURCHASE);

    const result = await processPurchaseFunction({
      eventId,
      quantity,
      customerDetails,
      fullName,
      phoneNumber,
      isPrivate,
      checkoutSessionId,
    });

    if ((result.data as any)?.success) {
      eventServiceLogger.info(`Successfully processed TicketTypes purchase for event ${eventId}`);
      return true;
    } else {
      eventServiceLogger.error(`Failed to process TicketTypes purchase: ${(result.data as any)?.error}`);
      return false;
    }
  } catch (error) {
    eventServiceLogger.error(`Error calling TicketTypes purchase function: ${error}`);
    return false;
  }
}
