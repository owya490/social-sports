export type ScannedTicketPreview = {
  ticketId: string;
  orderId: string | null;
  name: string | null;
  details: string | null;
};

const TICKET_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function asId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return TICKET_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function previewFromParts(
  ticketId: string,
  orderId: string | null,
  name: string | null,
  details: string | null
): ScannedTicketPreview {
  return { ticketId, orderId, name, details };
}

function parseJsonPayload(raw: string): ScannedTicketPreview | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const record = parsed as Record<string, unknown>;
  const ticketId = asId(
    readOptionalString(record.ticketId) ?? readOptionalString(record.ticket_id)
  );
  if (!ticketId) return null;

  return previewFromParts(
    ticketId,
    asId(readOptionalString(record.orderId) ?? readOptionalString(record.order_id)),
    readOptionalString(record.name) ??
      readOptionalString(record.fullName) ??
      readOptionalString(record.full_name),
    readOptionalString(record.details) ??
      readOptionalString(record.eventTicketTypeName) ??
      readOptionalString(record.ticketType)
  );
}

function parseUrlPayload(raw: string): ScannedTicketPreview | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const fromQuery = asId(
    url.searchParams.get("ticketId") ??
      url.searchParams.get("ticket_id") ??
      url.searchParams.get("ticket")
  );
  if (fromQuery) {
    return previewFromParts(
      fromQuery,
      asId(url.searchParams.get("orderId") ?? url.searchParams.get("order_id")),
      readOptionalString(url.searchParams.get("name") ?? url.searchParams.get("fullName")),
      readOptionalString(url.searchParams.get("details"))
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const ticketIdx = parts.findIndex((part) => part === "ticket" || part === "tickets");
  if (ticketIdx >= 0) {
    const ticketId = asId(parts[ticketIdx + 1]);
    if (ticketId) {
      return previewFromParts(ticketId, null, null, null);
    }
  }

  const last = asId(parts[parts.length - 1]);
  return last ? previewFromParts(last, null, null, null) : null;
}

/**
 * Reads a ticketId from a QR payload. Accepts a bare id, JSON, or URL.
 * Extra fields (orderId, name, details) are shown when the payload includes them.
 */
export function parseTicketQrPayload(raw: string): ScannedTicketPreview | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    const fromJson = parseJsonPayload(trimmed);
    if (fromJson) return fromJson;
  }

  const fromUrl = parseUrlPayload(trimmed);
  if (fromUrl) return fromUrl;

  const ticketId = asId(trimmed);
  return ticketId ? previewFromParts(ticketId, null, null, null) : null;
}
