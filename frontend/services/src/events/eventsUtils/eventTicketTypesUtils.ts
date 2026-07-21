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
 * Resolves the General Admission ticket type from an event's ticket types map.
 * Falls back to the sole map entry when present.
 */
export function findGeneralAdmissionTicketType(
  eventTicketTypes?: EventTicketTypesMap | null
): EventTicketType | null {
  if (!eventTicketTypes || Object.keys(eventTicketTypes).length === 0) {
    return null;
  }

  const general = findByName(eventTicketTypes, GENERAL_TICKET_TYPE_NAME);
  if (general) {
    return general;
  }

  const entries = Object.values(eventTicketTypes);
  if (entries.length === 1 && entries[0]) {
    return entries[0];
  }

  return null;
}

export function findGeneralTicketTypeId(
  eventTicketTypes?: EventTicketTypesMap | null
): EventTicketTypeId | null {
  return findGeneralAdmissionTicketType(eventTicketTypes)?.id ?? null;
}

/**
 * Copies General Admission price/capacity/vacancy onto the in-memory event object for UI.
 * If {@code eventTicketTypes} is missing, keeps existing top-level fields (legacy events).
 */
export function applyGeneralAdmissionInventoryFields<
  T extends {
    eventTicketTypes?: EventTicketTypesMap | null;
    price?: number;
    capacity?: number;
    vacancy?: number;
  },
>(event: T): T {
  const general = findGeneralAdmissionTicketType(event.eventTicketTypes);
  if (!general) {
    return event;
  }
  return {
    ...event,
    price: general.price,
    capacity: general.capacity,
    vacancy: general.vacancy,
  };
}

/**
 * Firestore updates for inventory. Prefers the General Admission map entry; falls back to
 * top-level price/capacity/vacancy for legacy events without eventTicketTypes.
 */
export function buildGeneralAdmissionInventoryUpdates(
  eventTicketTypes: EventTicketTypesMap | null | undefined,
  fields: Partial<{ price: number; capacity: number; vacancy: number }>
): Record<string, number> {
  const typeId = findGeneralTicketTypeId(eventTicketTypes);
  const updates: Record<string, number> = {};

  if (typeId) {
    if (fields.price !== undefined) {
      updates[`eventTicketTypes.${typeId}.price`] = fields.price;
    }
    if (fields.capacity !== undefined) {
      updates[`eventTicketTypes.${typeId}.capacity`] = fields.capacity;
    }
    if (fields.vacancy !== undefined) {
      updates[`eventTicketTypes.${typeId}.vacancy`] = fields.vacancy;
    }
    return updates;
  }

  if (fields.price !== undefined) {
    updates.price = fields.price;
  }
  if (fields.capacity !== undefined) {
    updates.capacity = fields.capacity;
  }
  if (fields.vacancy !== undefined) {
    updates.vacancy = fields.vacancy;
  }
  return updates;
}

/** Strip top-level inventory fields so they are never written to Firestore. */
export function omitTopLevelInventoryFields<T extends object>(
  data: T
): Omit<T, "price" | "capacity" | "vacancy"> {
  const { price: _price, capacity: _capacity, vacancy: _vacancy, ...rest } = data as T & {
    price?: number;
    capacity?: number;
    vacancy?: number;
  };
  return rest;
}
