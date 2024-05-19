import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn } from "./services/src/auth/authService";

export function middleware(request: NextRequest) {
  // const { user } = useUser();
  if (!isLoggedIn()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/event/create", "/(organiser*)", "/(profile*)"],
};
