// Homepage status banner — set to true to show the notice/maintenance banner on /
export const SHOW_HOMEPAGE_STATUS_BANNER = false;

// Booking maintenance — set BOOKING_MAINTENANCE_ENABLED to true to block bookings.
export const BOOKING_MAINTENANCE_ENABLED = false;

export const BOOKING_MAINTENANCE_MESSAGE =
  "We're on a maintenance break. Bookings will reopen at 6am AEST, Tuesday 5 August.";

export function isBookingMaintenanceActive(): boolean {
  return BOOKING_MAINTENANCE_ENABLED;
}

/** Organisers who see the Hub v2 promo banner on the v1 dashboard. */
export const ORGANISER_HUB_V2_BANNER_USER_IDS: readonly string[] = [
  "98PJNSoCmNU5zslxa1wIdZ3mPdf2", // sydgrassvolleyball
  "ZzuRS5v8hhWonnp2qdIOZG8R7f12", // sportshub prod
];

export function isOrganiserHubV2BannerEnabled(userId: string): boolean {
  return ORGANISER_HUB_V2_BANNER_USER_IDS.includes(userId);
}
