import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { FormId } from "@/interfaces/FormTypes";
import {
  GENERAL_TICKET_TYPE_NAME,
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
