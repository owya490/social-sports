export const SESSION_COOKIE_NAME = "reporting_session";
const MAX_SESSION_SECONDS = 60 * 60;

export function sessionMaxAgeSeconds(expiresAtSeconds: number, nowSeconds: number): number {
  const remaining = Math.floor(expiresAtSeconds - nowSeconds);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return 0;
  }
  return Math.min(remaining, MAX_SESSION_SECONDS);
}

export function sessionCookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
