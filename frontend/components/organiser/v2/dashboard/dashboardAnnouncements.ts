/**
 * SPORTSHUB → organiser announcements for the v2 dashboard.
 * Edit this list to ship Wrapped, release posts, or campaign highlights without touching layout code.
 */
export type DashboardAnnouncement = {
  id: string;
  label: string;
  href: string;
  /** Optional supporting line under the label */
  description?: string;
  /** Open in a new tab (external release posts, docs, etc.) */
  external?: boolean;
  /** Compact mono tag — Feature, Wrapped, Release, etc. */
  tag: string;
};

export const DASHBOARD_ANNOUNCEMENTS: DashboardAnnouncement[] = [
  {
    id: "ticket-types",
    tag: "Feature",
    label: "Ticket types",
    description: "Multiple prices, capacities, and forms on one event",
    href: "https://www.sportshub.net.au/blogs/features/ticket-types",
    external: true,
  },
  {
    id: "booking-approval",
    tag: "Feature",
    label: "Booking approval",
    description: "Review and approve bookings before tickets are issued",
    href: "https://www.sportshub.net.au/blogs/features/booking-approval",
    external: true,
  },
  {
    id: "wrapped-2025",
    tag: "Wrapped",
    label: "Your 2025 Wrapped",
    description: "Year in review from SPORTSHUB",
    href: "/organiser/wrapped/2025",
  },
];
