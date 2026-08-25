import { isStripeAccountActive } from "../src/stripe/stripeUtils";

describe("isStripeAccountActive", () => {
  it("is true only for a fully active Stripe account", () => {
    expect(isStripeAccountActive(true)).toBe(true);
    expect(isStripeAccountActive(false)).toBe(false);
    expect(isStripeAccountActive(null)).toBe(false);
    expect(isStripeAccountActive(undefined)).toBe(false);
  });
});
