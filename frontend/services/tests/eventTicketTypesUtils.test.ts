import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventFormAttachmentResult, EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import {
  GENERAL_TICKET_TYPE_NAME,
  applyEventFormAttachmentToTicketTypes,
  resolveEventTicketTypeName,
  resolveFormIdForTicketType,
} from "../src/events/eventsUtils/eventTicketTypesUtils";

const vipTypeId = "vip-type" as EventTicketTypeId;
const gaTypeId = "ga-type" as EventTicketTypeId;
const eventFormId = "event-form" as FormId;
const vipFormId = "vip-form" as FormId;
const gaFormId = "ga-form" as FormId;

const eventWithTypes = {
  formId: eventFormId,
  eventTicketTypes: {
    [gaTypeId]: {
      id: gaTypeId,
      name: GENERAL_TICKET_TYPE_NAME,
      price: 10,
      capacity: 20,
      vacancy: 10,
      formId: gaFormId,
    },
    [vipTypeId]: {
      id: vipTypeId,
      name: "VIP",
      price: 25,
      capacity: 5,
      vacancy: 2,
      formId: vipFormId,
    },
  },
};

describe("applyEventFormAttachmentToTicketTypes", () => {
  const result: EventFormAttachmentResult = {
    eventId: "event-1" as EventId,
    target: { kind: "ticketType", eventTicketTypeId: gaTypeId, ticketTypeName: "Renamed VIP" },
    formId: null,
    eventFormIdUpdated: false,
  };

  it("reconciles the authoritative name and form without replaying inventory or siblings", () => {
    const currentTypes = {
      ...eventWithTypes.eventTicketTypes,
      [gaTypeId]: { ...eventWithTypes.eventTicketTypes[gaTypeId], capacity: 40, vacancy: 3 },
    };
    const reconciled = applyEventFormAttachmentToTicketTypes(currentTypes, result)!;

    expect(reconciled[gaTypeId]).toEqual({ ...currentTypes[gaTypeId], name: "Renamed VIP", formId: null });
    expect(reconciled[vipTypeId]).toBe(currentTypes[vipTypeId]);
    expect(currentTypes[gaTypeId].formId).toBe(gaFormId);
    expect(resolveFormIdForTicketType({ formId: eventFormId, eventTicketTypes: reconciled }, gaTypeId)).toBeNull();
  });

  it("does not recreate missing targets or modify types for a legacy save", () => {
    const currentTypes = { [vipTypeId]: eventWithTypes.eventTicketTypes[vipTypeId] };
    expect(applyEventFormAttachmentToTicketTypes(currentTypes, result)).toBe(currentTypes);
    expect(applyEventFormAttachmentToTicketTypes(undefined, result)).toBeUndefined();
    expect(applyEventFormAttachmentToTicketTypes(currentTypes, {
      ...result, target: { kind: "legacyEvent" }, eventFormIdUpdated: true,
    })).toBe(currentTypes);
  });
});

describe("resolveFormIdForTicketType", () => {
  it("uses the ticket type formId instead of the event-level formId", () => {
    expect(resolveFormIdForTicketType(eventWithTypes, vipTypeId)).toBe(vipFormId);
    expect(resolveFormIdForTicketType(eventWithTypes, gaTypeId)).toBe(gaFormId);
  });

  it("does not fall back to event.formId for a non-GA type with no form", () => {
    const event = {
      formId: eventFormId,
      eventTicketTypes: {
        [vipTypeId]: {
          id: vipTypeId,
          name: "VIP",
          price: 25,
          capacity: 5,
          vacancy: 2,
          formId: null,
        },
      },
    };
    expect(resolveFormIdForTicketType(event, vipTypeId)).toBeNull();
  });

  it("falls back to event.formId for General Admission when the type form is unset", () => {
    const event = {
      formId: eventFormId,
      eventTicketTypes: {
        [gaTypeId]: {
          id: gaTypeId,
          name: GENERAL_TICKET_TYPE_NAME,
          price: 10,
          capacity: 20,
          vacancy: 10,
          formId: null,
        },
      },
    };
    expect(resolveFormIdForTicketType(event, gaTypeId)).toBe(eventFormId);
  });
});

describe("resolveEventTicketTypeName", () => {
  it("prefers the name stored on the ticket", () => {
    expect(resolveEventTicketTypeName(eventWithTypes, vipTypeId, "Early Bird VIP")).toBe("Early Bird VIP");
  });

  it("looks up the event ticket type name when the ticket has no stored name", () => {
    expect(resolveEventTicketTypeName(eventWithTypes, vipTypeId)).toBe("VIP");
  });

  it("uses General Admission when the ticket has no type", () => {
    expect(resolveEventTicketTypeName(eventWithTypes, undefined)).toBe(GENERAL_TICKET_TYPE_NAME);
  });
});
