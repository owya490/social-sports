import { cookies } from "next/headers";
import { FirebaseConfigError, getFirebaseProjectId } from "./firebaseConfig";
import { SESSION_COOKIE_NAME } from "./sessionCookie";
import { FirebaseTokenError, ReportingAccessError, verifyReportingIdToken } from "./verifyFirebaseIdToken";

export type ReportingSession = {
  uid: string;
  email: string | null;
};

export async function readReportingSession(): Promise<ReportingSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const payload = await verifyReportingIdToken(token, getFirebaseProjectId());
    return {
      uid: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch (error) {
    if (
      error instanceof FirebaseTokenError ||
      error instanceof ReportingAccessError ||
      error instanceof FirebaseConfigError
    ) {
      return null;
    }
    throw error;
  }
}
