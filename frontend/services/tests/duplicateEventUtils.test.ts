import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { UserId } from "@/interfaces/UserTypes";
import {
  buildDuplicatedNewEventData,
  duplicatedEventName,
} from "../src/events/eventsUtils/duplicateEventUtils";

describe("duplicatedEventName", () => {
  it("prefixes the original name", () => {
    expect(duplicatedEventName("Friday Social")).toBe("Copy of Friday Social");
  });

  it("falls back when the name is blank", () => {
    expect(duplicatedEventName("   ")).toBe("Copy of event");
  });
});

describe("buildDuplicatedNewEventData", () => {
  const originalTicketTypeId = "ticket-original" as EventTicketTypeId;
  const source: EventData = {
    ...EmptyEventData,
    eventId: "event-original" as EventData["eventId"],
    organiserId: "organiser-1" as UserId,
    name: "Friday Social",
    description: "Weekly pickup",
    location: "Moore Park",
    sport: "volleyball",
    isActive: false,
    isPrivate: true,
    paused: true,
    paymentsActive: true,
    price: 15,
    capacity: 20,
    vacancy: 3,
    attendees: { "hash@example.com": 2 },
    attendeesMetadata: { "hash@example.com": { names: ["Alex"], phones: ["0400"] } },
    accessCount: 42,
    formId: "form-1" as FormId,
    eventTags: ["indoor"],
    eventTicketTypes: {
      [originalTicketTypeId]: {
        id: originalTicketTypeId,
        name: "General Admission",
        price: 15,
        capacity: 20,
        vacancy: 3,
        formId: "form-1" as FormId,
      },
    },
  };

  it("copies listing details with a new name and empty attendance", () => {
    const duplicated = buildDuplicatedNewEventData(source);

    expect(duplicated.name).toBe("Copy of Friday Social");
    expect(duplicated.description).toBe("Weekly pickup");
    expect(duplicated.location).toBe("Moore Park");
    expect(duplicated.sport).toBe("volleyball");
    expect(duplicated.organiserId).toBe("organiser-1");
    expect(duplicated.isPrivate).toBe(true);
    expect(duplicated.paused).toBe(true);
    expect(duplicated.paymentsActive).toBe(true);
    expect(duplicated.formId).toBe("form-1");
    expect(duplicated.eventTags).toEqual(["indoor"]);
    expect(duplicated.eventTags).not.toBe(source.eventTags);
    expect(duplicated.isActive).toBe(true);
    expect(duplicated.attendees).toEqual({});
    expect(duplicated.attendeesMetadata).toEqual({});
    expect(duplicated.accessCount).toBe(0);
    expect(duplicated).not.toHaveProperty("eventId");
    expect(duplicated).not.toHaveProperty("organiser");
  });

  it("resets inventory and issues new ticket type ids", () => {
    const duplicated = buildDuplicatedNewEventData(source);
    const ticketTypes = Object.values(duplicated.eventTicketTypes ?? {});

    expect(duplicated.capacity).toBe(20);
    expect(duplicated.vacancy).toBe(20);
    expect(duplicated.price).toBe(15);
    expect(ticketTypes).toHaveLength(1);
    expect(ticketTypes[0].id).not.toBe(originalTicketTypeId);
    expect(ticketTypes[0].name).toBe("General Admission");
    expect(ticketTypes[0].capacity).toBe(20);
    expect(ticketTypes[0].vacancy).toBe(20);
    expect(ticketTypes[0].formId).toBe("form-1");
    expect(duplicated.eventTicketTypes?.[originalTicketTypeId]).toBeUndefined();
  });
});
