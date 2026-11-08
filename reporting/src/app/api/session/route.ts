import { NextResponse } from "next/server";
import { FirebaseConfigError, getFirebaseProjectId } from "@/lib/firebaseConfig";
import { sessionCookieBase, SESSION_COOKIE_NAME, sessionMaxAgeSeconds } from "@/lib/sessionCookie";
import { FirebaseTokenError, ReportingAccessError, verifyReportingIdToken } from "@/lib/verifyFirebaseIdToken";

export async function POST(request: Request) {
  let idToken = "";
  try {
    const body = (await request.json()) as { idToken?: unknown };
    if (typeof body.idToken === "string") {
      idToken = body.idToken;
    }
  } catch {
    return NextResponse.json({ error: "Sign-in could not be verified." }, { status: 401 });
  }

  try {
    const payload = await verifyReportingIdToken(idToken, getFirebaseProjectId());
    const expiresAt = typeof payload.exp === "number" ? payload.exp : 0;
    const maxAge = sessionMaxAgeSeconds(expiresAt, Math.floor(Date.now() / 1000));
    if (maxAge <= 0) {
      throw new FirebaseTokenError();
    }
    const response = NextResponse.json({
      ok: true,
      email: typeof payload.email === "string" ? payload.email : null,
    });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: idToken,
      ...sessionCookieBase(),
      maxAge,
    });
    return response;
  } catch (error) {
    const status = error instanceof ReportingAccessError ? 403 : error instanceof FirebaseConfigError ? 500 : 401;
    const message =
      error instanceof ReportingAccessError || error instanceof FirebaseConfigError || error instanceof FirebaseTokenError
        ? error.message
        : "Sign-in could not be verified.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...sessionCookieBase(),
    maxAge: 0,
  });
  return response;
}
