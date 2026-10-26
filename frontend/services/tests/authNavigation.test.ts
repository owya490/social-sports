import { getAuthPageHref, getSafeReturnTo, isProtectedRoute } from "../src/auth/authNavigation";

describe("auth navigation", () => {
  it.each(["/organiser", "/organiser/v2/event/event-1", "/profile", "/event/create", "/onboarding/organiser"])(
    "accepts the protected route %s",
    (path) => {
      expect(isProtectedRoute(path)).toBe(true);
      expect(getSafeReturnTo(path)).toBe(path);
    }
  );

  it.each([
    undefined,
    null,
    "",
    "https://example.com/organiser",
    "//example.com/organiser",
    "organiser",
    "/organiser-elsewhere",
    "/profileOther",
    "/event/createSomething",
    "/onboardingOther",
    "/login?returnTo=/organiser",
    "/register",
    "/resetPassword",
    "/organiser/../login",
    "/organiser/%2e%2e/login",
    "/organiser\\other",
    "/organiser\nother",
    "/organiser/%5cother",
    "/organiser/%0aother",
    "/organiser/%zz",
  ])("discards an unsafe or unsupported destination %s", (path) => {
    expect(getSafeReturnTo(path)).toBeNull();
    expect(getAuthPageHref("/login", path)).toBe("/login");
  });

  it("canonicalizes the path without decoding query values or fragments", () => {
    expect(getSafeReturnTo("/organiser/v2/./event/../event/event-1?filter=a%2Fb%26c#ticket%20details")).toBe(
      "/organiser/v2/event/event-1?filter=a%2Fb%26c#ticket%20details"
    );
  });

  it.each(["/login", "/register", "/resetPassword"] as const)(
    "preserves the complete destination through %s",
    (page) => {
      const destination = "/organiser/v2/event/event-1?filter=a%2Fb%26c#ticket%20details";
      const authUrl = new URL(getAuthPageHref(page, destination), "https://sportshub.invalid");
      expect(authUrl.pathname).toBe(page);
      expect(authUrl.searchParams.get("returnTo")).toBe(destination);
    }
  );
});
