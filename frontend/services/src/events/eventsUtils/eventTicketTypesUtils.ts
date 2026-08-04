import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";

export const GENERAL_TICKET_TYPE_NAME = "General Admission";

type InventoryFields = Partial<{ price: number; capacity: number; vacancy: number }>;

type EventWithInventory = {
  eventTicketTypes?: EventTicketTypesMap | null;
  price?: number;
  capacity?: number;
  vacancy?: number;
};

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

/** New events: write top-level fields and a matching General Admission ticket type. */
export function buildNewEventInventory(price: number, capacity: number) {
  return {
    price,
    capacity,
    vacancy: capacity,
    eventTicketTypes: buildEventTicketTypesFromLegacyEvent({ price, capacity, vacancy: capacity }),
  };
}

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
  return { [eventTicketType.id]: eventTicketType };
}

export function findGeneralAdmissionTicketType(
  eventTicketTypes?: EventTicketTypesMap | null
): EventTicketType | null {
  if (!eventTicketTypes || Object.keys(eventTicketTypes).length === 0) {
    return null;
  }

  const byName = Object.values(eventTicketTypes).find((type) => type?.name === GENERAL_TICKET_TYPE_NAME);
  if (byName) {
    return byName;
  }

  const entries = Object.values(eventTicketTypes);
  return entries.length === 1 && entries[0] ? entries[0] : null;
}

/** Prefer eventTicketTypes; fall back to top-level fields for legacy events. */
export function resolveGeneralAdmissionInventory(event: EventWithInventory) {
  const general = findGeneralAdmissionTicketType(event.eventTicketTypes);
  if (general) {
    return {
      price: general.price,
      capacity: general.capacity,
      vacancy: general.vacancy,
      typeId: general.id,
    };
  }
  return {
    price: event.price ?? 0,
    capacity: event.capacity ?? 0,
    vacancy: event.vacancy ?? 0,
    typeId: null,
  };
}

/** Copies resolved inventory onto top-level fields for UI components. */
export function applyGeneralAdmissionInventoryFields<T extends object>(event: T): T {
  const { price, capacity, vacancy, typeId } = resolveGeneralAdmissionInventory(event as EventWithInventory);
  if (!typeId) {
    return event;
  }
  return { ...event, price, capacity, vacancy };
}

/** Firestore updates: nested when eventTicketTypes exists, otherwise top-level. */
export function buildGeneralAdmissionInventoryUpdates(
  eventTicketTypes: EventTicketTypesMap | null | undefined,
  fields: InventoryFields
): Record<string, number> {
  const typeId = findGeneralAdmissionTicketType(eventTicketTypes)?.id ?? null;
  const updates: Record<string, number> = {};

  for (const key of ["price", "capacity", "vacancy"] as const) {
    const value = fields[key];
    if (value === undefined) {
      continue;
    }
    updates[typeId ? `eventTicketTypes.${typeId}.${key}` : key] = value;
  }

  return updates;
}

/** In-memory merge for APIs that send full event objects (e.g. recurrence templates). */
export function mergeInventoryIntoEventData<T extends EventWithInventory>(
  event: T,
  fields: InventoryFields
): T {
  const patch: InventoryFields = {};
  for (const key of ["price", "capacity", "vacancy"] as const) {
    if (fields[key] !== undefined) {
      patch[key] = fields[key];
    }
  }
  if (Object.keys(patch).length === 0) {
    return event;
  }

  const general = findGeneralAdmissionTicketType(event.eventTicketTypes);
  if (!general) {
    return { ...event, ...patch };
  }

  return {
    ...event,
    eventTicketTypes: {
      ...event.eventTicketTypes!,
      [general.id]: { ...general, ...patch },
    },
  };
}
