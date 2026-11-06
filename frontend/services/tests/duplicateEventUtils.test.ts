import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";
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
    expect(duplicated.isActive).toBe(true);
    expect(duplicated.startDate).toBe(source.startDate);
    expect(duplicated.endDate).toBe(source.endDate);
    expect(duplicated.registrationDeadline).toBe(source.registrationDeadline);
  });

  it("uses the title and schedule chosen before duplicating", () => {
    const startDate = new Timestamp(1_700_000_000, 0);
    const endDate = new Timestamp(1_700_003_600, 0);
    const registrationDeadline = new Timestamp(1_699_990_000, 0);
    const duplicated = buildDuplicatedNewEventData(source, {
      name: "  Saturday Social  ",
      startDate,
      endDate,
      registrationDeadline,
    });

    expect(duplicated.name).toBe("Saturday Social");
    expect(duplicated.startDate).toBe(startDate);
    expect(duplicated.endDate).toBe(endDate);
    expect(duplicated.registrationDeadline).toBe(registrationDeadline);
    expect(duplicated.isActive).toBe(true);
  });
});
