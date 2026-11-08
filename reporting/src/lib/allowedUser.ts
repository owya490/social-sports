/** The only Firebase Auth user allowed into the internal reporting app. */
export const ALLOWED_REPORTING_UID = "ZzuRS5v8hhWonnp2qdIOZG8R7f12";

export function isAllowedReportingUser(uid: string | undefined): boolean {
  return uid === ALLOWED_REPORTING_UID;
}
