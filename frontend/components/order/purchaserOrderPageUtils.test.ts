import {
  buildPurchaserOrderDocumentTitle,
  DEFAULT_PURCHASER_ORDER_DOCUMENT_TITLE,
} from "./purchaserOrderPageUtils";

describe("buildPurchaserOrderDocumentTitle", () => {
  it("uses ticket type name, event name, and order id", () => {
    expect(
      buildPurchaserOrderDocumentTitle({
        ticketTypeNames: ["VIP"],
        eventName: "Friday Social",
        eventId: "event-123",
        orderId: "order-456",
      })
    ).toBe("VIP for Friday Social · order-456");
  });

  it("falls back to event id when the event has no name", () => {
    expect(
      buildPurchaserOrderDocumentTitle({
        ticketTypeNames: ["General Admission"],
        eventName: "",
        eventId: "event-123",
        orderId: "order-456",
      })
    ).toBe("General Admission for event-123 · order-456");
  });

  it("dedupes ticket type names on mixed-type orders", () => {
    expect(
      buildPurchaserOrderDocumentTitle({
        ticketTypeNames: ["VIP", "VIP", "Student"],
        eventName: "Friday Social",
        orderId: "order-456",
      })
    ).toBe("VIP, Student for Friday Social · order-456");
  });

  it("returns the default title when nothing is loaded", () => {
    expect(buildPurchaserOrderDocumentTitle({ ticketTypeNames: [] })).toBe(DEFAULT_PURCHASER_ORDER_DOCUMENT_TITLE);
  });
});
