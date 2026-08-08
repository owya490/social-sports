// Homepage status banner — set to true to show the notice/maintenance banner on /
export const SHOW_HOMEPAGE_STATUS_BANNER = false;

// Booking maintenance — set BOOKING_MAINTENANCE_ENABLED to true to block bookings.
export const BOOKING_MAINTENANCE_ENABLED = false;

export const BOOKING_MAINTENANCE_MESSAGE =
  "We're on a maintenance break. Bookings will reopen at 6am AEST, Tuesday 5 August.";

export function isBookingMaintenanceActive(): boolean {
  return BOOKING_MAINTENANCE_ENABLED;
}
