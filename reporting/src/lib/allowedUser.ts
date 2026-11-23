/** Firebase Auth users allowed into the internal reporting app. */
export const ALLOWED_REPORTING_UIDS = ["ZzuRS5v8hhWonnp2qdIOZG8R7f12", "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2"] as const;

export const ALLOWED_REPORTING_UID = ALLOWED_REPORTING_UIDS[0];

const allowedReportingUids = new Set<string>(ALLOWED_REPORTING_UIDS);

export function isAllowedReportingUser(uid: string | undefined): boolean {
  return uid !== undefined && allowedReportingUids.has(uid);
}
