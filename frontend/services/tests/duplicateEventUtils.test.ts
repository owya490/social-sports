import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { buildDuplicatedNewEventData } from "../src/events/eventsUtils/duplicateEventUtils";

describe("buildDuplicatedNewEventData", () => {
  const originalTicketTypeId = "ticket-original" as EventTicketTypeId;
  const source: EventData = {
    ...EmptyEventData,
    eventId: "event-original" as EventData["eventId"],
    name: "Friday Social",
    capacity: 20,
    vacancy: 3,
    attendees: { "hash@example.com": 2 },
    accessCount: 42,
    eventTicketTypes: {
      [originalTicketTypeId]: {
        id: originalTicketTypeId,
        name: "General Admission",
        price: 15,
        capacity: 20,
        vacancy: 3,
        formId: null,
      },
    },
  };

  it("copies the listing as a new unsold event named Copy of the original", () => {
    const duplicated = buildDuplicatedNewEventData(source);
    const ticketTypes = Object.values(duplicated.eventTicketTypes ?? {});

    expect(duplicated.name).toBe("Copy of Friday Social");
    expect(duplicated).not.toHaveProperty("eventId");
    expect(duplicated).not.toHaveProperty("organiser");
    expect(duplicated.attendees).toEqual({});
    expect(duplicated.accessCount).toBe(0);
    expect(duplicated.vacancy).toBe(20);
    expect(ticketTypes).toHaveLength(1);
    expect(ticketTypes[0].id).not.toBe(originalTicketTypeId);
    expect(ticketTypes[0].vacancy).toBe(20);
  });
});
