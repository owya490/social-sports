// Mirrors the backend StripeConfig: 1% SPORTSHUB + 1.65% + 30c Stripe, rounded up to the cent per booking.
export const SPORTSHUB_FEE_PERCENTAGE = 2.65;
export const SPORTSHUB_FIXED_FEE_CENTS = 30;

export function sportshubFeeCents(ticketPriceCents: number): number {
  if (ticketPriceCents <= 0) return 0;
  return Math.ceil(SPORTSHUB_FIXED_FEE_CENTS + ticketPriceCents * (SPORTSHUB_FEE_PERCENTAGE / 100));
}
