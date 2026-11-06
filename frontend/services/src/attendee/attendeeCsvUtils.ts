import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export const ATTENDEE_CSV_HEADERS = [
  { label: "Ticket Count", key: "Ticket Count" },
  { label: "Attendee Name", key: "Attendee Name" },
  { label: "Email", key: "Email" },
  { label: "Phone Number", key: "Phone Number" },
];

export type AttendeeCsvRow = {
  "Ticket Count": string;
  "Attendee Name": string;
  Email: string;
  "Phone Number": string;
};

/**
 * CSV rows for an organiser attendee list.
 * Ticket rows come from the tickets in the map (approved / filtered), not `order.tickets`.
 */
export function buildAttendeeCsvData(orderTicketsMap: Map<Order, Ticket[]>): AttendeeCsvRow[] {
  const sortedEntries = Array.from(orderTicketsMap.entries())
    .filter(([, tickets]) => tickets.length > 0)
    .sort(([a], [b]) => a.fullName.localeCompare(b.fullName));

  return sortedEntries.flatMap(([order, tickets]) => {
    const phone = order.phone ? `${order.phone}` : "N/A";
    const rows: AttendeeCsvRow[] = [
      {
        "Ticket Count": `${tickets.length}`,
        "Attendee Name": order.fullName,
        Email: order.email,
        "Phone Number": phone,
      },
    ];
    for (let i = 1; i < tickets.length; i++) {
      rows.push({
        "Ticket Count": "",
        "Attendee Name": `${order.fullName} +${i}`,
        Email: order.email,
        "Phone Number": phone,
      });
    }
    return rows;
  });
}

/**
 * Unique emails for people with at least one ticket in the map.
 * Extra tickets on the same order share one email. Comparison is case-insensitive.
 */
export function buildAttendeeEmailList(orderTicketsMap: Map<Order, Ticket[]>): string[] {
  const byKey = new Map<string, string>();
  for (const [order, tickets] of orderTicketsMap) {
    if (tickets.length === 0) {
      continue;
    }
    const email = order.email.trim();
    if (!email) {
      continue;
    }
    const key = email.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, email);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
