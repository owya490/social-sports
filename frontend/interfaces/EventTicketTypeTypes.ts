import { Branded } from "./index";

export type EventTicketTypeId = Branded<string, "EventTicketTypeId">;

export interface EventTicketType {
  id: EventTicketTypeId;
  name: string;
  price: number;
  capacity: number;
  vacancy: number;
}

export type EventTicketTypesMap = Record<EventTicketTypeId, EventTicketType>;

export const EMPTY_EVENT_TICKET_TYPE: EventTicketType = {
  id: "" as EventTicketTypeId,
  name: "",
  price: 0,
  capacity: 0,
  vacancy: 0,
};
