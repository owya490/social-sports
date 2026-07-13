import { FormId } from "./FormTypes";
import { Branded } from "./index";

export type EventTicketTypeId = Branded<string, "EventTicketTypeId">;

export interface EventTicketType {
  name: string;
  description?: string;
  price: number;
  capacity: number;
  vacancy: number;
  formId: FormId | null;
  sortOrder: number;
  isActive: boolean;
}

export type EventTicketTypesMap = Record<EventTicketTypeId, EventTicketType>;

export const EMPTY_EVENT_TICKET_TYPE: EventTicketType = {
  name: "",
  price: 0,
  capacity: 0,
  vacancy: 0,
  formId: null,
  sortOrder: 0,
  isActive: true,
};
