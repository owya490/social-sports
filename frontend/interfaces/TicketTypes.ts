import { Timestamp } from "firebase/firestore";
import { EventId, OrderId, TicketId } from "./EventTypes";

export interface Ticket {
  ticketId: TicketId;
  eventId: EventId;
  orderId: OrderId;
  price: number;
  purchaseDate: Timestamp;
}

export const EMPTY_TICKET: Ticket = {
  ticketId: "",
  eventId: "",
  orderId: "",
  price: 0,
  purchaseDate: Timestamp.now(),
};

export const TicketCollectionPath = "Tickets";
