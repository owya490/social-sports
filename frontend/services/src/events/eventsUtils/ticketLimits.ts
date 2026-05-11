import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  MAX_TICKETS_PER_TRANSACTION_ORGANISER_CAP,
} from "@/interfaces/EventTypes";

export function clampTicketQuantity(quantity: number, min: number, max: number): number {
  return Math.min(Math.max(quantity, min), max);
}

export function getBuyerMaxTicketsPerTransaction(maxTicketsPerTransaction?: number): number {
  return clampTicketQuantity(
    maxTicketsPerTransaction ?? DEFAULT_MAX_TICKETS_PER_ORDER,
    1,
    MAX_TICKETS_PER_TRANSACTION_ORGANISER_CAP
  );
}

export function getOrganiserMaxTicketsPerTransactionLimit(capacity: number): number {
  return Math.max(1, Math.min(capacity, MAX_TICKETS_PER_TRANSACTION_ORGANISER_CAP));
}

export function clampMaxTicketsPerTransaction(maxTicketsPerTransaction: number, capacity: number): number {
  return clampTicketQuantity(
    Math.round(maxTicketsPerTransaction),
    1,
    getOrganiserMaxTicketsPerTransactionLimit(capacity)
  );
}

export function getTicketCountOptions(maxTickets: number): number[] {
  return Array.from({ length: Math.max(0, maxTickets) }, (_, i) => i + 1);
}

export function getBuyerTicketCountOptions(vacancy: number, maxTicketsPerTransaction?: number): number[] {
  const maxTickets = Math.min(vacancy, getBuyerMaxTicketsPerTransaction(maxTicketsPerTransaction));
  return getTicketCountOptions(maxTickets);
}

export function getBuyerTicketCountOptionsWithStoredSessions(
  vacancy: number,
  maxTicketsPerTransaction: number | undefined,
  hasStoredSession: (ticketCount: number) => boolean
): number[] {
  const maxTickets = getBuyerMaxTicketsPerTransaction(maxTicketsPerTransaction);
  const storedSessionCounts = getTicketCountOptions(maxTickets).filter(hasStoredSession);

  return [...new Set([...getBuyerTicketCountOptions(vacancy, maxTicketsPerTransaction), ...storedSessionCounts])].sort(
    (a, b) => a - b
  );
}
