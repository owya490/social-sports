import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export type EventWithOptionalTicketTypes = {
  eventTicketTypes?: EventTicketTypesMap;
  price?: number;
  capacity?: number;
  vacancy?: number;
};

export function hasEventTicketTypes(event: EventWithOptionalTicketTypes): boolean {
  return event.eventTicketTypes != null && Object.keys(event.eventTicketTypes).length > 0;
}

export function getSortedEventTicketTypes(
  eventTicketTypes: EventTicketTypesMap | undefined
): Array<{ eventTicketTypeId: EventTicketTypeId; eventTicketType: EventTicketType }> {
  if (!eventTicketTypes) {
    return [];
  }
  return Object.entries(eventTicketTypes)
    .map(([eventTicketTypeId, eventTicketType]) => ({
      eventTicketTypeId: eventTicketTypeId as EventTicketTypeId,
      eventTicketType,
    }))
    .sort((a, b) => a.eventTicketType.sortOrder - b.eventTicketType.sortOrder);
}

export function getActiveSortedEventTicketTypes(
  eventTicketTypes: EventTicketTypesMap | undefined
): Array<{ eventTicketTypeId: EventTicketTypeId; eventTicketType: EventTicketType }> {
  return getSortedEventTicketTypes(eventTicketTypes).filter(({ eventTicketType }) => eventTicketType.isActive);
}

export function findEventTicketType(
  eventTicketTypes: EventTicketTypesMap | undefined,
  eventTicketTypeId: EventTicketTypeId
): EventTicketType | undefined {
  return eventTicketTypes?.[eventTicketTypeId];
}

export function syncEventAggregatesFromTicketTypes(eventTicketTypes: EventTicketTypesMap): {
  price: number;
  capacity: number;
  vacancy: number;
} {
  const activeTypes = Object.values(eventTicketTypes).filter((t) => t.isActive);
  if (activeTypes.length === 0) {
    return { price: 0, capacity: 0, vacancy: 0 };
  }
  return {
    price: Math.min(...activeTypes.map((t) => t.price)),
    capacity: activeTypes.reduce((sum, t) => sum + t.capacity, 0),
    vacancy: activeTypes.reduce((sum, t) => sum + t.vacancy, 0),
  };
}

export function createEventTicketTypeId(): EventTicketTypeId {
  return crypto.randomUUID() as EventTicketTypeId;
}

export function createEventTicketType(params: {
  name: string;
  price: number;
  capacity: number;
  formId?: FormId | null;
  sortOrder?: number;
  description?: string;
}): { eventTicketTypeId: EventTicketTypeId; eventTicketType: EventTicketType } {
  const eventTicketTypeId = createEventTicketTypeId();
  return {
    eventTicketTypeId,
    eventTicketType: {
      name: params.name,
      description: params.description,
      price: params.price,
      capacity: params.capacity,
      vacancy: params.capacity,
      formId: params.formId ?? null,
      sortOrder: params.sortOrder ?? 0,
      isActive: true,
    },
  };
}

/** When increasing capacity, preserve sold count via vacancy math. */
export function applyCapacityChange(current: EventTicketType, newCapacity: number): EventTicketType {
  const sold = current.capacity - current.vacancy;
  const newVacancy = Math.max(0, newCapacity - sold);
  return {
    ...current,
    capacity: newCapacity,
    vacancy: newVacancy,
  };
}

/** Summarise ticket types for an order's tickets (e.g. "Men's x2, Women's x1"). */
export function formatTicketTypeSummary(tickets: Ticket[]): string | null {
  const counts = new Map<string, number>();
  tickets.forEach((ticket) => {
    const label = ticket.eventTicketTypeName?.trim();
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  if (counts.size === 0) return null;
  return Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${name} ×${count}` : name))
    .join(", ");
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

export function buildEventTicketTypesFromLegacyEvent(params: {
  price: number;
  capacity: number;
  vacancy: number;
  formId: FormId | null;
  name?: string;
}): EventTicketTypesMap {
  const { eventTicketTypeId, eventTicketType } = createEventTicketType({
    name: params.name ?? "General Admission",
    price: params.price,
    capacity: params.capacity,
    formId: params.formId,
    sortOrder: 0,
  });
  return {
    [eventTicketTypeId]: {
      ...eventTicketType,
      vacancy: params.vacancy,
    },
  };
}
