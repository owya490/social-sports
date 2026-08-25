import { createEventInitialData } from "./createEventFormTypes";

describe("createEventInitialData", () => {
  it("keeps payments on when Stripe status is omitted", () => {
    expect(createEventInitialData().paymentsActive).toBe(true);
  });

  it("defaults payments on when the organiser Stripe account is active", () => {
    expect(createEventInitialData({ stripeAccountActive: true }).paymentsActive).toBe(true);
  });

  it("defaults payments off when the organiser Stripe account is not active", () => {
    expect(createEventInitialData({ stripeAccountActive: false }).paymentsActive).toBe(false);
    expect(createEventInitialData({ stripeAccountActive: null }).paymentsActive).toBe(false);
  });
});
