import { isStripeAccountActive, withInactiveStripePaymentDefaults } from "../src/stripe/stripeUtils";

describe("isStripeAccountActive", () => {
  it("is true only for a fully active Stripe account", () => {
    expect(isStripeAccountActive(true)).toBe(true);
    expect(isStripeAccountActive(false)).toBe(false);
    expect(isStripeAccountActive(null)).toBe(false);
    expect(isStripeAccountActive(undefined)).toBe(false);
  });
});

describe("withInactiveStripePaymentDefaults", () => {
  const form = {
    paymentsActive: true,
    bookingApprovalEnabled: true,
    stripeFeeToCustomer: false,
    promotionalCodesEnabled: true,
    name: "Friday Social",
  };

  it("leaves payment fields unchanged when Stripe is active", () => {
    expect(withInactiveStripePaymentDefaults(form, true)).toEqual(form);
  });

  it("turns payments and booking approval off when Stripe is not active", () => {
    expect(withInactiveStripePaymentDefaults(form, false)).toEqual({
      ...form,
      paymentsActive: false,
      bookingApprovalEnabled: false,
      stripeFeeToCustomer: true,
      promotionalCodesEnabled: false,
    });
    expect(withInactiveStripePaymentDefaults(form, null).paymentsActive).toBe(false);
  });
});
