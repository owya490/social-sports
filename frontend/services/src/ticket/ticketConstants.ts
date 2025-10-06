/**
 * Constants for ticket types and related configuration
 */
export const TICKET_TYPE_IDS = {
  ADMIN: "Admin",
  GENERAL: "General",
} as const;

export type TicketTypeId = (typeof TICKET_TYPE_IDS)[keyof typeof TICKET_TYPE_IDS];

/**
 * Default ticket type configurations
 */
export const TICKET_TYPE_DEFAULTS = {
  [TICKET_TYPE_IDS.ADMIN]: {
    id: TICKET_TYPE_IDS.ADMIN,
    name: "Admin",
    price: 0,
    availableQuantity: Number.MAX_SAFE_INTEGER,
    soldQuantity: 0,
  },
  [TICKET_TYPE_IDS.GENERAL]: {
    id: TICKET_TYPE_IDS.GENERAL,
    name: "General",
    price: 0, // Set dynamically based on event price
    availableQuantity: 0, // Set dynamically based on event capacity
    soldQuantity: 0,
  },
} as const;
