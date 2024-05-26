import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./utilities/constants";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value || undefined;
  // TODO: make dataabase call to verify the current user has a session, if not log user out and force to log back in
  if (session === undefined) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/event/create", "/(organiser*)", "/(profile*)"],
};
