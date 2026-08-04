// Booking maintenance — set BOOKING_MAINTENANCE_ENABLED to true to block bookings.
// Auto-expires at 6am AEST, 5 August 2026 when enabled.
export const BOOKING_MAINTENANCE_ENABLED = false;
const BOOKING_MAINTENANCE_ENDS_AT = new Date("2026-08-04T20:00:00.000Z");

export const BOOKING_MAINTENANCE_MESSAGE =
  "We're on a maintenance break. Bookings will reopen at 6am AEST, Tuesday 5 August.";

export const BOOKING_NOTICE_MESSAGE =
  "If you run into issues booking, please reach out to info@sportshub.net.au. We are rolling out some exciting new features.";

export function isBookingMaintenanceActive(): boolean {
  if (!BOOKING_MAINTENANCE_ENABLED) {
    return false;
  }
  return Date.now() < BOOKING_MAINTENANCE_ENDS_AT.getTime();
}
