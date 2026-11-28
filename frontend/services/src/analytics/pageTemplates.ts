export type PageGroup = "public" | "account" | "booking" | "organiser";

export type ScreenInfo = {
  pageTemplate: string;
  pageGroup: PageGroup;
};

type RouteRule = {
  test: (path: string) => boolean;
  template: string;
  group: PageGroup;
};

function exact(path: string, group: PageGroup): RouteRule {
  return { test: (candidate) => candidate === path, template: path, group };
}

function pattern(expression: RegExp, template: string, group: PageGroup): RouteRule {
  return { test: (candidate) => expression.test(candidate), template, group };
}

const ROUTE_RULES: RouteRule[] = [
  exact("/", "public"),
  exact("/landing", "public"),
  exact("/aboutUs", "public"),
  exact("/contact", "public"),
  exact("/loading", "public"),
  exact("/timeout", "public"),
  exact("/not-found", "public"),
  pattern(/^\/error\/[^/]+$/, "/error/[type]", "public"),
  exact("/error", "public"),
  exact("/login", "account"),
  exact("/register", "account"),
  exact("/resetPassword", "account"),
  exact("/profile", "account"),
  exact("/onboarding", "account"),
  exact("/onboarding/attendee", "account"),
  exact("/onboarding/organiser", "account"),
  exact("/onboarding/organiser/profile", "account"),
  exact("/event/create", "organiser"),
  pattern(/^\/event\/success\/[^/]+$/, "/event/success/[id]", "booking"),
  pattern(/^\/event\/[^/]+\/[^/]+$/, "/event/[id]/[customEventLink]", "public"),
  pattern(/^\/event\/[^/]+$/, "/event/[id]", "public"),
  exact("/event", "public"),
  pattern(/^\/event-collection\/[^/]+$/, "/event-collection/[id]", "public"),
  pattern(/^\/user\/[^/]+\/wrapped\/[^/]+$/, "/user/[id]/wrapped/[year]", "public"),
  pattern(/^\/user\/[^/]+$/, "/user/[id]", "public"),
  exact("/user", "public"),
  exact("/forms/forms-submitted", "booking"),
  pattern(/^\/forms\/[^/]+\/[^/]+\/submit-form$/, "/forms/[formId]/[eventId]/submit-form", "booking"),
  pattern(/^\/forms\/[^/]+\/[^/]+\/[^/]+$/, "/forms/[formId]/[eventId]/[responseId]", "booking"),
  pattern(/^\/fulfilment\/[^/]+\/[^/]+$/, "/fulfilment/[fulfilmentSessionId]/[fulfilmentEntityId]", "booking"),
  pattern(/^\/order\/[^/]+$/, "/order/[orderId]", "booking"),
  exact("/stripe/refreshAccountLink", "organiser"),
  exact("/organiser/v2", "organiser"),
  exact("/organiser/v2/dashboard", "organiser"),
  exact("/organiser/v2/settings", "organiser"),
  exact("/organiser/v2/gallery", "organiser"),
  exact("/organiser/v2/welcome", "organiser"),
  exact("/organiser/v2/welcome/events", "organiser"),
  pattern(/^\/organiser\/v2\/welcome\/event\/[^/]+$/, "/organiser/v2/welcome/event/[id]", "organiser"),
  exact("/organiser/v2/forms/gallery", "organiser"),
  pattern(/^\/organiser\/v2\/forms\/[^/]+\/editor$/, "/organiser/v2/forms/[formId]/editor", "organiser"),
  pattern(/^\/organiser\/v2\/forms\/[^/]+\/preview$/, "/organiser/v2/forms/[formId]/preview", "organiser"),
  pattern(
    /^\/organiser\/v2\/forms\/[^/]+\/[^/]+\/[^/]+$/,
    "/organiser/v2/forms/[formId]/[eventId]/[responseId]",
    "organiser"
  ),
  exact("/organiser/v2/event/dashboard", "organiser"),
  exact("/organiser/v2/event/calendar", "organiser"),
  exact("/organiser/v2/event/custom-links", "organiser"),
  exact("/organiser/v2/event/event-collection", "organiser"),
  pattern(
    /^\/organiser\/v2\/event\/event-collection\/[^/]+$/,
    "/organiser/v2/event/event-collection/[id]",
    "organiser"
  ),
  exact("/organiser/v2/event/recurring-events", "organiser"),
  pattern(
    /^\/organiser\/v2\/event\/recurring-events\/[^/]+$/,
    "/organiser/v2/event/recurring-events/[id]",
    "organiser"
  ),
  pattern(/^\/organiser\/v2\/event\/[^/]+$/, "/organiser/v2/event/[id]", "organiser"),
  exact("/organiser/dashboard", "organiser"),
  exact("/organiser/metrics", "organiser"),
  exact("/organiser/settings", "organiser"),
  exact("/organiser/gallery", "organiser"),
  exact("/organiser/forms/gallery", "organiser"),
  pattern(/^\/organiser\/forms\/[^/]+\/editor$/, "/organiser/forms/[formId]/editor", "organiser"),
  pattern(/^\/organiser\/forms\/[^/]+\/preview$/, "/organiser/forms/[formId]/preview", "organiser"),
  pattern(/^\/organiser\/forms\/[^/]+\/[^/]+\/[^/]+$/, "/organiser/forms/[formId]/[eventId]/[responseId]", "organiser"),
  exact("/organiser/event/dashboard", "organiser"),
  exact("/organiser/event/custom-links", "organiser"),
  exact("/organiser/event/event-collection", "organiser"),
  pattern(/^\/organiser\/event\/event-collection\/[^/]+$/, "/organiser/event/event-collection/[id]", "organiser"),
  exact("/organiser/event/recurring-events", "organiser"),
  pattern(/^\/organiser\/event\/recurring-events\/[^/]+$/, "/organiser/event/recurring-events/[id]", "organiser"),
  pattern(/^\/organiser\/wrapped\/[^/]+$/, "/organiser/wrapped/[year]", "organiser"),
  pattern(/^\/organiser\/event\/[^/]+$/, "/organiser/event/[id]", "organiser"),
];

export function normalizePathname(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

function fallbackGroup(path: string): PageGroup {
  if (path.startsWith("/organiser") || path.startsWith("/event/create") || path.startsWith("/stripe")) {
    return "organiser";
  }
  if (
    path.startsWith("/onboarding") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/profile") ||
    path.startsWith("/resetPassword")
  ) {
    return "account";
  }
  if (
    path.startsWith("/fulfilment") ||
    path.startsWith("/order") ||
    path.startsWith("/forms") ||
    path.startsWith("/event/success")
  ) {
    return "booking";
  }
  return "public";
}

export function screenForPathname(pathname: string): ScreenInfo {
  try {
    const path = normalizePathname(pathname);
    for (const rule of ROUTE_RULES) {
      if (rule.test(path)) {
        return { pageTemplate: rule.template, pageGroup: rule.group };
      }
    }
    return {
      pageTemplate: path.replace(/\/[^/]{12,}/g, "/[id]"),
      pageGroup: fallbackGroup(path),
    };
  } catch {
    return { pageTemplate: "/", pageGroup: "public" };
  }
}

export function tabScreenTemplate(baseTemplate: string, tab: string): string {
  try {
    const slug = tab
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${baseTemplate}/${slug || "unknown"}`;
  } catch {
    return baseTemplate;
  }
}
