import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";

export const GENERAL_TICKET_TYPE_NAME = "General";
/** Legacy name used by older event create helpers before rename to General. */
export const LEGACY_GENERAL_ADMISSION_NAME = "General Admission";

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

/** Mirror top-level price/capacity/vacancy into a single General ticket type. */
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
 * Resolves the General ticket type ID from an event's ticket types map.
 * Falls back to legacy "General Admission" or the sole map entry.
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

  const legacy = findByName(eventTicketTypes, LEGACY_GENERAL_ADMISSION_NAME);
  if (legacy) {
    return legacy.id;
  }

  const entries = Object.values(eventTicketTypes);
  if (entries.length === 1 && entries[0]) {
    return entries[0].id;
  }

  return null;
}

/**
 * Returns extra Firestore field paths to co-update on the General ticket type
 * whenever top-level price/capacity/vacancy are written.
 *
 * Always reconciles all three fields onto the General type (using the new partial values
 * when provided, otherwise current top-level event values) so stale map entries from the
 * rollout period are corrected on any organiser edit.
 */
export function appendGeneralTicketTypeCoUpdates(
  event: {
    eventTicketTypes?: EventTicketTypesMap;
    price?: number;
    capacity?: number;
    vacancy?: number;
  },
  partialFields: Partial<{ price: number; capacity: number; vacancy: number }>
): Record<string, string | number> {
  const hasPrice = partialFields.price !== undefined;
  const hasCapacity = partialFields.capacity !== undefined;
  const hasVacancy = partialFields.vacancy !== undefined;
  if (!hasPrice && !hasCapacity && !hasVacancy) {
    return {};
  }

  const reconciledPrice = partialFields.price ?? event.price ?? 0;
  const reconciledCapacity = partialFields.capacity ?? event.capacity ?? 0;
  const reconciledVacancy = partialFields.vacancy ?? event.vacancy ?? reconciledCapacity;

  const updates: Record<string, string | number> = {};
  let typeId = findGeneralTicketTypeId(event.eventTicketTypes);

  if (!typeId) {
    const created = createEventTicketType({
      name: GENERAL_TICKET_TYPE_NAME,
      price: reconciledPrice,
      capacity: reconciledCapacity,
      vacancy: reconciledVacancy,
    });
    typeId = created.id;
    updates[`eventTicketTypes.${typeId}.id`] = created.id;
    updates[`eventTicketTypes.${typeId}.name`] = created.name;
  } else {
    updates[`eventTicketTypes.${typeId}.id`] = typeId;
    const existing = event.eventTicketTypes?.[typeId];
    updates[`eventTicketTypes.${typeId}.name`] = existing?.name ?? GENERAL_TICKET_TYPE_NAME;
  }

  // Always force all three fields onto the General type so stale maps catch up to top-level.
  updates[`eventTicketTypes.${typeId}.price`] = reconciledPrice;
  updates[`eventTicketTypes.${typeId}.capacity`] = reconciledCapacity;
  updates[`eventTicketTypes.${typeId}.vacancy`] = reconciledVacancy;
  return updates;
}
