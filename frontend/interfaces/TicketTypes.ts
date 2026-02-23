import { Timestamp } from "firebase/firestore";
import { EventId, OrderId, TicketId } from "./EventTypes";
import { FormResponseId } from "./FormTypes";
import { OrderAndTicketStatus } from "./OrderTypes";

export interface Ticket {
  ticketId: TicketId;
  eventId: EventId;
  orderId: OrderId;
  price: number;
  purchaseDate: Timestamp;
  status: OrderAndTicketStatus;
  formResponseId: FormResponseId | null; // the absence of this means the ticket was purchased without a form response
}

export const EMPTY_TICKET: Ticket = {
  ticketId: "" as TicketId,
  eventId: "" as EventId,
  orderId: "" as OrderId,
  price: 0,
  purchaseDate: Timestamp.now(),
  status: OrderAndTicketStatus.APPROVED,
  formResponseId: null,
};

export const TicketsCollectionPath = "Tickets";
