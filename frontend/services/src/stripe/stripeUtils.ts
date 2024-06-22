import { getUrlWithCurrentHostname } from "../urlUtils";

export function getRefreshAccountLinkUrl() {
  return getUrlWithCurrentHostname("/stripe/refreshAccountLink");
}
