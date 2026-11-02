const protectedRoutes = ["/organiser", "/profile", "/event/create", "/onboarding"];

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function getSafeReturnTo(value?: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) {
    return null;
  }

  try {
    const url = new URL(value, "https://sportshub.invalid");
    if (
      !isProtectedRoute(url.pathname) ||
      /%(?![\da-f]{2})|%(?:0[\da-f]|1[\da-f]|5c|7f)/i.test(url.pathname)
    ) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getAuthPageHref(
  pathname: "/login" | "/register" | "/resetPassword",
  returnTo?: string | null
): string {
  const destination = getSafeReturnTo(returnTo);
  return destination ? `${pathname}?${new URLSearchParams({ returnTo: destination })}` : pathname;
}
