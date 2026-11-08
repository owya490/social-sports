import { EventData } from "@/interfaces/EventTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Timestamp } from "firebase/firestore";

function isTimestampOnOrAfter(value: Timestamp, since: Timestamp): boolean {
  if (value.seconds !== since.seconds) {
    return value.seconds > since.seconds;
  }
  return value.nanoseconds >= since.nanoseconds;
}

export function filterEventsStartingOnOrAfter(
  events: EventData[],
  startDateOnOrAfter: Timestamp
): EventData[] {
  return events.filter((event) => isTimestampOnOrAfter(event.startDate, startDateOnOrAfter));
}

export function filterTicketsPurchasedOnOrAfter(
  tickets: Ticket[],
  purchasedOnOrAfter: Timestamp
): Ticket[] {
  return tickets.filter((ticket) => isTimestampOnOrAfter(ticket.purchaseDate, purchasedOnOrAfter));
}
