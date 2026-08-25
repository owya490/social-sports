import { getUrlWithCurrentHostname } from "../urlUtils";

export function getRefreshAccountLinkUrl() {
  return getUrlWithCurrentHostname("/stripe/refreshAccountLink");
}

export function isStripeAccountActive(stripeAccountActive: boolean | null | undefined): boolean {
  return stripeAccountActive === true;
}

type StripePaymentFields = {
  paymentsActive: boolean;
  bookingApprovalEnabled: boolean;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
};

/** Payments stay off unless the organiser's Stripe account is active. */
export function withInactiveStripePaymentDefaults<T extends StripePaymentFields>(
  form: T,
  stripeAccountActive: boolean | null | undefined
): T {
  if (isStripeAccountActive(stripeAccountActive)) return form;
  return {
    ...form,
    paymentsActive: false,
    bookingApprovalEnabled: false,
    stripeFeeToCustomer: true,
    promotionalCodesEnabled: false,
  };
}
