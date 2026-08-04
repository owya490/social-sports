// Booking maintenance — auto-expires at 6am AEST, 5 August 2026
const BOOKING_MAINTENANCE_ENDS_AT = new Date("2026-08-04T20:00:00.000Z");

export const BOOKING_MAINTENANCE_MESSAGE =
  "We're on a maintenance break. Bookings will reopen at 6am AEST, Tuesday 5 August.";

export function isBookingMaintenanceActive(): boolean {
  return Date.now() < BOOKING_MAINTENANCE_ENDS_AT.getTime();
}
