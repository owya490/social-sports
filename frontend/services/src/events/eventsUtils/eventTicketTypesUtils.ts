import { EventTicketType, EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";

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

/** Mirror legacy top-level price/capacity/vacancy into a single hanging General Admission ticket type. */
export function buildEventTicketTypesFromLegacyEvent(params: {
  price: number;
  capacity: number;
  vacancy: number;
  name?: string;
}): EventTicketTypesMap {
  const eventTicketType = createEventTicketType({
    name: params.name ?? "General Admission",
    price: params.price,
    capacity: params.capacity,
    vacancy: params.vacancy,
  });
  return {
    [eventTicketType.id]: eventTicketType,
  };
}
