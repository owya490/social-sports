import { webcrypto } from "crypto";
import { EventTicketTypeId } from "../../interfaces/EventTicketTypeTypes";
import { FormId } from "../../interfaces/FormTypes";
import {
  applyCapacityChange,
  buildEventTicketTypesFromLegacyEvent,
  createEventTicketType,
  GENERAL_TICKET_TYPE_NAME,
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveFormIdForTicketType,
  syncEventAggregatesFromTicketTypes,
} from "../src/events/eventsUtils/eventTicketTypesUtils";

Object.defineProperty(globalThis, "crypto", { value: webcrypto });

describe("eventTicketTypesUtils", () => {
  it("creates a ticket type with id, vacancy, and optional formId", () => {
    const type = createEventTicketType({
      name: "Men's",
      price: 1500,
      capacity: 10,
      formId: "form-1" as FormId,
    });
    expect(type.id).toBeTruthy();
    expect(type.name).toBe("Men's");
    expect(type.vacancy).toBe(10);
    expect(type.formId).toBe("form-1");
  });

  it("sorts General Admission first then by name", () => {
    const a = createEventTicketType({ name: "Women's", price: 0, capacity: 5 });
    const b = createEventTicketType({ name: GENERAL_TICKET_TYPE_NAME, price: 0, capacity: 5 });
    const c = createEventTicketType({ name: "Men's", price: 0, capacity: 5 });
    const sorted = getSortedEventTicketTypes({ [a.id]: a, [b.id]: b, [c.id]: c });
    expect(sorted.map((t) => t.eventTicketType.name)).toEqual([
      GENERAL_TICKET_TYPE_NAME,
      "Men's",
      "Women's",
    ]);
  });

  it("syncs aggregates as min price and summed capacity/vacancy", () => {
    const a = createEventTicketType({ name: "A", price: 2000, capacity: 10, vacancy: 4 });
    const b = createEventTicketType({ name: "B", price: 1000, capacity: 5, vacancy: 5 });
    expect(syncEventAggregatesFromTicketTypes({ [a.id]: a, [b.id]: b })).toEqual({
      price: 1000,
      capacity: 15,
      vacancy: 9,
    });
  });

  it("preserves sold count when capacity changes", () => {
    const type = createEventTicketType({ name: "A", price: 0, capacity: 10, vacancy: 3 });
    const updated = applyCapacityChange(type, 12);
    expect(updated.capacity).toBe(12);
    expect(updated.vacancy).toBe(5);
  });

  it("rejects capacity below sold count", () => {
    const type = createEventTicketType({ name: "A", price: 0, capacity: 10, vacancy: 3 });
    expect(() => applyCapacityChange(type, 6)).toThrow(/sold/i);
  });

  it("resolves formId from ticket type; only General Admission falls back to event.formId", () => {
    const nonGa = createEventTicketType({ name: "Men's", price: 0, capacity: 5, formId: null });
    const ga = createEventTicketType({
      name: GENERAL_TICKET_TYPE_NAME,
      price: 0,
      capacity: 5,
      formId: null,
    });
    const event = {
      formId: "event-form" as FormId,
      eventTicketTypes: { [nonGa.id]: nonGa, [ga.id]: ga },
    };

    expect(resolveFormIdForTicketType(event, nonGa.id)).toBeNull();
    expect(resolveFormIdForTicketType(event, ga.id)).toBe("event-form");

    const withForm = { ...nonGa, formId: "type-form" as FormId };
    expect(
      resolveFormIdForTicketType(
        { formId: "event-form" as FormId, eventTicketTypes: { [nonGa.id]: withForm } },
        nonGa.id as EventTicketTypeId
      )
    ).toBe("type-form");
  });

  it("builds legacy inventory map with General Admission", () => {
    const map = buildEventTicketTypesFromLegacyEvent({
      price: 500,
      capacity: 20,
      vacancy: 18,
      formId: null,
    });
    expect(hasEventTicketTypes({ eventTicketTypes: map })).toBe(true);
    const [only] = Object.values(map);
    expect(only.name).toBe(GENERAL_TICKET_TYPE_NAME);
    expect(only.vacancy).toBe(18);
  });
});
