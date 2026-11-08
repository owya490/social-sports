export const DEFAULT_PURCHASER_ORDER_DOCUMENT_TITLE = "Order | SPORTSHUB";

/** Browser tab label: ticket type name for the event, plus the order id. */
export function buildPurchaserOrderDocumentTitle(params: {
  ticketTypeNames: string[];
  eventName?: string | null;
  eventId?: string | null;
  orderId?: string | null;
}): string {
  const uniqueTypes = [
    ...new Set(params.ticketTypeNames.map((name) => name.trim()).filter((name) => name.length > 0)),
  ];
  const ticketName = uniqueTypes.join(", ");
  const eventLabel = params.eventName?.trim() || params.eventId?.trim() || "";
  const orderId = params.orderId?.trim() || "";

  const parts: string[] = [];
  if (ticketName && eventLabel) {
    parts.push(`${ticketName} for ${eventLabel}`);
  } else if (ticketName) {
    parts.push(ticketName);
  } else if (eventLabel) {
    parts.push(eventLabel);
  }
  if (orderId) {
    parts.push(orderId);
  }
  return parts.length > 0 ? parts.join(" · ") : DEFAULT_PURCHASER_ORDER_DOCUMENT_TITLE;
}
