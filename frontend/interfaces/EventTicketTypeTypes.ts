import { FormId } from "./FormTypes";
import { Branded } from "./index";

export type EventTicketTypeId = Branded<string, "EventTicketTypeId">;

export interface EventTicketType {
  id: EventTicketTypeId;
  name: string;
  price: number;
  capacity: number;
  vacancy: number;
  /**
   * Optional registration form for this ticket type. General Admission falls back to
   * event.formId when unset; other types with a null formId use no form.
   */
  formId?: FormId | null;
}

export type EventTicketTypesMap = Record<EventTicketTypeId, EventTicketType>;

export const EMPTY_EVENT_TICKET_TYPE: EventTicketType = {
  id: "" as EventTicketTypeId,
  name: "",
  price: 0,
  capacity: 0,
  vacancy: 0,
  formId: null,
};

export const EMPTY_EVENT_TICKET_TYPES: EventTicketTypesMap = {};

export function createEmptyEventTicketTypes(): EventTicketTypesMap {
  return structuredClone(EMPTY_EVENT_TICKET_TYPES);
}
