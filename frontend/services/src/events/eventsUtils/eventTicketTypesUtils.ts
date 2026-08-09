import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export const GENERAL_TICKET_TYPE_NAME = "General Admission";

type InventoryFields = Partial<{ price: number; capacity: number; vacancy: number }>;

type EventWithInventory = {
  eventTicketTypes?: EventTicketTypesMap | null;
  price?: number;
  capacity?: number;
  vacancy?: number;
  formId?: FormId | null;
};

export type SortedEventTicketType = {
  eventTicketTypeId: EventTicketTypeId;
  eventTicketType: EventTicketType;
};

export function createEventTicketTypeId(): EventTicketTypeId {
  return crypto.randomUUID() as EventTicketTypeId;
}

export function createEventTicketType(params: {
  name: string;
  price: number;
  capacity: number;
  vacancy?: number;
  formId?: FormId | null;
}): EventTicketType {
  const id = createEventTicketTypeId();
  return {
    id,
    name: params.name,
    price: params.price,
    capacity: params.capacity,
    vacancy: params.vacancy ?? params.capacity,
    formId: params.formId ?? null,
  };
}

export function hasEventTicketTypes(event: EventWithInventory): boolean {
  return event.eventTicketTypes != null && Object.keys(event.eventTicketTypes).length > 0;
}

/** Sorted list for organiser UI; General Admission first, then name. */
export function getSortedEventTicketTypes(
  eventTicketTypes: EventTicketTypesMap | null | undefined
): SortedEventTicketType[] {
  if (!eventTicketTypes) {
    return [];
  }
  return Object.entries(eventTicketTypes)
    .map(([eventTicketTypeId, eventTicketType]) => ({
      eventTicketTypeId: (eventTicketType.id || eventTicketTypeId) as EventTicketTypeId,
      eventTicketType: {
        ...eventTicketType,
        id: (eventTicketType.id || eventTicketTypeId) as EventTicketTypeId,
        formId: eventTicketType.formId ?? null,
      },
    }))
    .sort((a, b) => {
      if (a.eventTicketType.name === GENERAL_TICKET_TYPE_NAME) return -1;
      if (b.eventTicketType.name === GENERAL_TICKET_TYPE_NAME) return 1;
      return a.eventTicketType.name.localeCompare(b.eventTicketType.name);
    });
}

/** New events: write top-level fields and a matching General Admission ticket type. */
export function buildNewEventInventory(price: number, capacity: number, formId: FormId | null = null) {
  return {
    price,
    capacity,
    vacancy: capacity,
    eventTicketTypes: buildEventTicketTypesFromLegacyEvent({
      price,
      capacity,
      vacancy: capacity,
      formId,
    }),
  };
}

export function buildEventTicketTypesFromLegacyEvent(params: {
  price: number;
  capacity: number;
  vacancy: number;
  formId?: FormId | null;
  name?: string;
}): EventTicketTypesMap {
  const eventTicketType = createEventTicketType({
    name: params.name ?? GENERAL_TICKET_TYPE_NAME,
    price: params.price,
    capacity: params.capacity,
    vacancy: params.vacancy,
    formId: params.formId ?? null,
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

/** Resolves the default checkout ticket type ID (General Admission) for API requests. */
export function resolveCheckoutTicketTypeId(event: EventWithInventory): EventTicketTypeId {
  const general = findGeneralAdmissionTicketType(event.eventTicketTypes);
  if (!general?.id) {
    throw new Error("Event has no General Admission ticket type for checkout");
  }
  return general.id;
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

/**
 * Listing / fill-bar inventory for an event.
 * Ticket types are the source of truth; top-level price/capacity/vacancy are legacy-only.
 */
export function resolveEventInventory(event: EventWithInventory): {
  price: number;
  capacity: number;
  vacancy: number;
} {
  if (hasEventTicketTypes(event)) {
    return syncEventAggregatesFromTicketTypes(event.eventTicketTypes!);
  }
  return {
    price: event.price ?? 0,
    capacity: event.capacity ?? 0,
    vacancy: event.vacancy ?? 0,
  };
}

/** Copies resolved inventory onto top-level fields for UI components. */
export function applyGeneralAdmissionInventoryFields<T extends object>(event: T): T {
  const withInventory = event as EventWithInventory;
  return { ...event, ...resolveEventInventory(withInventory) };
}

/**
 * Top-level listing aggregates when multiple ticket types exist:
 * price = minimum across types, capacity/vacancy = sums.
 */
export function syncEventAggregatesFromTicketTypes(eventTicketTypes: EventTicketTypesMap): {
  price: number;
  capacity: number;
  vacancy: number;
} {
  const types = Object.values(eventTicketTypes);
  if (types.length === 0) {
    return { price: 0, capacity: 0, vacancy: 0 };
  }
  return {
    price: Math.min(...types.map((t) => t.price)),
    capacity: types.reduce((sum, t) => sum + t.capacity, 0),
    vacancy: types.reduce((sum, t) => sum + t.vacancy, 0),
  };
}

/** When increasing/decreasing capacity, preserve sold count via vacancy math. */
export function applyCapacityChange(current: EventTicketType, newCapacity: number): EventTicketType {
  const sold = Math.max(0, current.capacity - current.vacancy);
  if (newCapacity < sold) {
    throw new Error(`Capacity cannot be lower than tickets already sold (${sold}).`);
  }
  return {
    ...current,
    capacity: newCapacity,
    vacancy: newCapacity - sold,
  };
}

export function countSoldTicketsForType(
  orderTicketsMap: Map<Order, Ticket[]>,
  eventTicketTypeId: EventTicketTypeId
): number {
  let count = 0;
  orderTicketsMap.forEach((tickets) => {
    tickets.forEach((ticket) => {
      if (ticket.eventTicketTypeId === eventTicketTypeId) {
        count += 1;
      }
    });
  });
  return count;
}

function findEventTicketType(
  eventTicketTypes: EventTicketTypesMap | null | undefined,
  eventTicketTypeId: EventTicketTypeId
): EventTicketType | null {
  if (!eventTicketTypes) {
    return null;
  }
  const byKey = eventTicketTypes[eventTicketTypeId];
  if (byKey) {
    return byKey;
  }
  return Object.values(eventTicketTypes).find((type) => type?.id === eventTicketTypeId) ?? null;
}

/**
 * Form for a ticket type. Prefer the type's formId; only General Admission falls back to
 * event.formId when unset. Other types with a null formId use no form.
 */
export function resolveFormIdForTicketType(
  event: EventWithInventory,
  eventTicketTypeId: EventTicketTypeId | null | undefined
): FormId | null {
  const eventFormId = (event.formId as FormId | null | undefined) ?? null;
  if (!eventTicketTypeId) {
    return eventFormId;
  }

  const ticketType = findEventTicketType(event.eventTicketTypes, eventTicketTypeId);
  if (!ticketType) {
    return eventFormId;
  }

  if (ticketType.formId) {
    return ticketType.formId as FormId;
  }

  if (ticketType.name === GENERAL_TICKET_TYPE_NAME) {
    return eventFormId;
  }

  return null;
}

/** True if formId is the event-level form or any ticket type's form. */
export function isFormAttachedToEvent(event: EventWithInventory, formId: FormId): boolean {
  if (event.formId === formId) {
    return true;
  }

  const ticketTypes = event.eventTicketTypes;
  if (!ticketTypes) {
    return false;
  }

  return Object.values(ticketTypes).some((ticketType) => ticketType?.formId === formId);
}

/** All formIds attached at event level or on any ticket type (deduped). */
export function getAttachedFormIdsForEvent(event: EventWithInventory): FormId[] {
  const ids: FormId[] = [];
  const seen = new Set<string>();
  const add = (formId: FormId | null | undefined) => {
    if (!formId || seen.has(formId)) {
      return;
    }
    seen.add(formId);
    ids.push(formId);
  };

  add((event.formId as FormId | null | undefined) ?? null);
  if (event.eventTicketTypes) {
    for (const ticketType of Object.values(event.eventTicketTypes)) {
      add((ticketType?.formId as FormId | null | undefined) ?? null);
    }
  }
  return ids;
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
