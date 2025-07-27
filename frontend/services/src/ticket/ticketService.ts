import { TicketTypeData } from "@/interfaces/TicketTypeTypes";
import { doc, setDoc, collection, getDocs, updateDoc, increment } from "firebase/firestore";
import { eventServiceLogger } from "../events/eventsService";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";

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

export async function updateTicketTypeSoldQuantity(eventId: string, ticketTypeId: string, quantityChange: number): Promise<void> {
  try {
    const eventDocSnapshot = await findEventDoc(eventId);
    const eventDocRef = eventDocSnapshot.ref;
    const ticketTypeDocRef = doc(eventDocRef, "TicketTypes", ticketTypeId);

    await updateDoc(ticketTypeDocRef, {
      soldQuantity: increment(quantityChange)
    });

    // Only sync event vacancy for General tickets
    if (ticketTypeId === "General") {
      await updateDoc(eventDocRef, {
        vacancy: increment(-quantityChange)
      });
      eventServiceLogger.info(`Updated General ticket sold quantity by ${quantityChange} and synced event vacancy`);
    } else {
      eventServiceLogger.info(`Updated ${ticketTypeId} ticket sold quantity by ${quantityChange} (no vacancy sync)`);
    }
  } catch (error) {
    eventServiceLogger.error(`Failed to update ticket type sold quantity: ${error}`);
    throw error;
  }
}

export async function reduceGeneralTicketAvailability(eventId: string, quantity: number): Promise<void> {
  try {
    const eventDocSnapshot = await findEventDoc(eventId);
    const eventDocRef = eventDocSnapshot.ref;
    const generalTicketDocRef = doc(eventDocRef, "TicketTypes", "General");

    await updateDoc(generalTicketDocRef, {
      availableQuantity: increment(-quantity)
    });

    await updateDoc(eventDocRef, {
      vacancy: increment(-quantity)
    });

    eventServiceLogger.info(`Reduced General ticket availability by ${quantity} for organizer addition and synced event vacancy`);
  } catch (error) {
    eventServiceLogger.error(`Failed to reduce general ticket availability: ${error}`);
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
      price: price,
      availableQuantity: capacity,
      soldQuantity: 0,
    },
  ];
  for (const ticketType of DEFAULT_TICKET_TYPES) {
    await addTicketTypeToEvent(eventId, ticketType);
  }
}