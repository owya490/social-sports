import { Timestamp } from "firebase/firestore";
import { EventId, OrderId, TicketId } from "./EventTypes";
import { OrderAndTicketStatus } from "./OrderTypes";

export interface Ticket {
  ticketId: TicketId;
  eventId: EventId;
  orderId: OrderId;
  price: number;
  purchaseDate: Timestamp;
  status: OrderAndTicketStatus;
}

export const EMPTY_TICKET: Ticket = {
  ticketId: "",
  eventId: "",
  orderId: "",
  price: 0,
  purchaseDate: Timestamp.now(),
  status: OrderAndTicketStatus.APPROVED,
};

export const TicketsCollectionPath = "Tickets";
