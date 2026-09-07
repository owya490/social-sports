import { EventData } from "@/interfaces/EventTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Timestamp } from "firebase/firestore";

export function filterEventsStartingOnOrAfter(
  events: EventData[],
  startDateOnOrAfter: Timestamp
): EventData[] {
  return events.filter((event) => event.startDate.seconds >= startDateOnOrAfter.seconds);
}

export function filterTicketsPurchasedOnOrAfter(
  tickets: Ticket[],
  purchasedOnOrAfter: Timestamp
): Ticket[] {
  return tickets.filter((ticket) => ticket.purchaseDate.seconds >= purchasedOnOrAfter.seconds);
}
