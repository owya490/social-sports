import { parseTicketQrPayload } from "./parseTicketQr";

describe("parseTicketQrPayload", () => {
  it("reads a bare ticket id", () => {
    expect(parseTicketQrPayload("  abcdEFGH12345678  ")).toEqual({
      ticketId: "abcdEFGH12345678",
      orderId: null,
      name: null,
      details: null,
    });
  });

  it("reads JSON with ticket, order, name, and details", () => {
    expect(
      parseTicketQrPayload(
        JSON.stringify({
          ticketId: "ticket-abc-12345",
          orderId: "order-xyz-67890",
          name: "Alex Player",
          details: "General admission",
        })
      )
    ).toEqual({
      ticketId: "ticket-abc-12345",
      orderId: "order-xyz-67890",
      name: "Alex Player",
      details: "General admission",
    });
  });

  it("reads ticketId from a URL query and path", () => {
    expect(
      parseTicketQrPayload("https://sportshub.net.au/checkin?ticketId=ticketQuery1234&name=Sam")
    ).toEqual({
      ticketId: "ticketQuery1234",
      orderId: null,
      name: "Sam",
      details: null,
    });

    expect(parseTicketQrPayload("https://sportshub.net.au/ticket/ticketPath12345")).toEqual({
      ticketId: "ticketPath12345",
      orderId: null,
      name: null,
      details: null,
    });
  });

  it("rejects empty or implausible payloads", () => {
    expect(parseTicketQrPayload("")).toBeNull();
    expect(parseTicketQrPayload("short")).toBeNull();
    expect(parseTicketQrPayload("{not-json")).toBeNull();
    expect(parseTicketQrPayload(JSON.stringify({ name: "No ticket" }))).toBeNull();
  });
});
