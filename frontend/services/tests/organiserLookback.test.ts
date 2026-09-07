import { EmptyEventData, EventId } from "@/interfaces/EventTypes";
import { OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import {
  filterEventsStartingOnOrAfter,
  filterTicketsPurchasedOnOrAfter,
} from "../src/organiser/organiserLookback";
import { Timestamp } from "firebase/firestore";

describe("organiser lookback filters", () => {
  const since = new Timestamp(1_000_000, 0);

  it("keeps events on or after the startDate cut and drops older ones", () => {
    const older = {
      ...EmptyEventData,
      eventId: "old" as EventId,
      startDate: new Timestamp(since.seconds - 1, 0),
    };
    const boundary = {
      ...EmptyEventData,
      eventId: "boundary" as EventId,
      startDate: since,
    };
    const newer = {
      ...EmptyEventData,
      eventId: "new" as EventId,
      startDate: new Timestamp(since.seconds + 1, 0),
    };

    expect(filterEventsStartingOnOrAfter([older, boundary, newer], since).map((event) => event.eventId)).toEqual([
      "boundary",
      "new",
    ]);
  });

  it("keeps tickets purchased on or after the cut and drops older ones", () => {
    const older: Ticket = {
      ticketId: "old" as Ticket["ticketId"],
      eventId: "event" as EventId,
      orderId: "order" as Ticket["orderId"],
      price: 1000,
      purchaseDate: new Timestamp(since.seconds - 10, 0),
      status: OrderAndTicketStatus.APPROVED,
      formResponseId: null,
      type: OrderAndTicketType.GENERAL,
    };
    const recent: Ticket = {
      ...older,
      ticketId: "recent" as Ticket["ticketId"],
      purchaseDate: since,
    };

    expect(filterTicketsPurchasedOnOrAfter([older, recent], since).map((ticket) => ticket.ticketId)).toEqual([
      "recent",
    ]);
  });
});
