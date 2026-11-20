import { NextResponse, type NextRequest } from "next/server";
import { getFirebaseProjectId } from "./lib/firebaseConfig";
import { sessionCookieBase, SESSION_COOKIE_NAME } from "./lib/sessionCookie";
import { verifyReportingIdToken } from "./lib/verifyFirebaseIdToken";

async function hasAllowedSession(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  try {
    await verifyReportingIdToken(token, getFirebaseProjectId());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/session") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const allowed = await hasAllowedSession(token);

  if (pathname === "/login") {
    if (!allowed) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (allowed) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  if (token) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      ...sessionCookieBase(),
      maxAge: 0,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
