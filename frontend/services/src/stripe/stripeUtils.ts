import { getUrlWithCurrentHostname } from "../urlUtils";

export function getRefreshAccountLinkUrl() {
  return getUrlWithCurrentHostname("/stripe/refreshAccountLink");
}

export function isStripeAccountActive(stripeAccountActive: boolean | null | undefined): boolean {
  return stripeAccountActive === true;
}
