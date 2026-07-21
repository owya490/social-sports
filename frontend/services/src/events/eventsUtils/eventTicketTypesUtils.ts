import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";

export const GENERAL_TICKET_TYPE_NAME = "General Admission";

export function createEventTicketTypeId(): EventTicketTypeId {
  return crypto.randomUUID() as EventTicketTypeId;
}

export function createEventTicketType(params: {
  name: string;
  price: number;
  capacity: number;
  vacancy?: number;
}): EventTicketType {
  const id = createEventTicketTypeId();
  return {
    id,
    name: params.name,
    price: params.price,
    capacity: params.capacity,
    vacancy: params.vacancy ?? params.capacity,
  };
}

/** Seed a single General Admission ticket type from event price/capacity/vacancy. */
export function buildEventTicketTypesFromLegacyEvent(params: {
  price: number;
  capacity: number;
  vacancy: number;
  name?: string;
}): EventTicketTypesMap {
  const eventTicketType = createEventTicketType({
    name: params.name ?? GENERAL_TICKET_TYPE_NAME,
    price: params.price,
    capacity: params.capacity,
    vacancy: params.vacancy,
  });
  return {
    [eventTicketType.id]: eventTicketType,
  };
}

function findByName(ticketTypes: EventTicketTypesMap, name: string): EventTicketType | undefined {
  return Object.values(ticketTypes).find((ticketType) => ticketType?.name === name);
}

/**
 * Resolves the General Admission ticket type ID from an event's ticket types map.
 * Falls back to the sole map entry when present.
 */
export function findGeneralTicketTypeId(
  eventTicketTypes?: EventTicketTypesMap | null
): EventTicketTypeId | null {
  if (!eventTicketTypes || Object.keys(eventTicketTypes).length === 0) {
    return null;
  }

  const general = findByName(eventTicketTypes, GENERAL_TICKET_TYPE_NAME);
  if (general) {
    return general.id;
  }

  const entries = Object.values(eventTicketTypes);
  if (entries.length === 1 && entries[0]) {
    return entries[0].id;
  }

  return null;
}
