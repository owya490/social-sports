import {
  isWelcomeFlowPath,
  WELCOME_PATH,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";
import {
  ArrowPathIcon,
  CalendarIcon,
  CameraIcon,
  Cog6ToothIcon,
  LinkIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export type OrganiserNavItem = {
  href: string;
  label: string;
  icon: typeof Squares2X2Icon;
  isActive: (pathname: string) => boolean;
  tourId?: string;
  /** Shown in command search */
  keywords?: string[];
};

export type OrganiserBreadcrumb = {
  label: string;
  href?: string;
  /** Optional leading icon — used for section crumbs, not the current page. */
  icon?: typeof Squares2X2Icon;
};

const EVENT_STATIC_ROUTES = new Set(["dashboard", "recurring-events", "event-collection", "custom-links"]);

const crumb = (label: string, href?: string, icon?: typeof Squares2X2Icon): OrganiserBreadcrumb =>
  href ? { label, href, icon } : { label, icon };

export const isEventDetailPage = (pathname: string) => {
  const match = pathname.match(/^\/organiser\/v2\/event\/([^/]+)/);
  if (!match) return false;
  return !EVENT_STATIC_ROUTES.has(match[1]);
};

export const ORGANISER_MAIN_NAV: OrganiserNavItem[] = [
  {
    href: "/organiser/v2/dashboard",
    label: "Dashboard",
    icon: Squares2X2Icon,
    keywords: ["home", "overview"],
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/dashboard") ||
      pathname === WELCOME_PATH ||
      pathname === `${WELCOME_PATH}/`,
  },
  {
    href: "/organiser/v2/event/dashboard",
    label: "Events",
    icon: CalendarIcon,
    tourId: "nav-events",
    keywords: ["sessions", "catalogue"],
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/event/dashboard") ||
      pathname.startsWith(`${WELCOME_PATH}/events`) ||
      pathname.startsWith(`${WELCOME_PATH}/event/`) ||
      isEventDetailPage(pathname),
  },
  {
    href: "/organiser/v2/event/recurring-events",
    label: "Recurring events",
    icon: ArrowPathIcon,
    keywords: ["series", "templates"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/event/recurring-events"),
  },
  {
    href: "/organiser/v2/event/event-collection",
    label: "Event collections",
    icon: RectangleStackIcon,
    keywords: ["groups"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/event/event-collection"),
  },
  {
    href: "/organiser/v2/event/custom-links",
    label: "Custom event links",
    icon: LinkIcon,
    keywords: ["urls", "short links"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/event/custom-links"),
  },
];

export const ORGANISER_SECONDARY_NAV: OrganiserNavItem[] = [
  {
    href: "/organiser/v2/forms/gallery",
    label: "Forms",
    icon: PencilSquareIcon,
    keywords: ["registration", "survey"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/forms"),
  },
  {
    href: "/organiser/v2/gallery",
    label: "Gallery",
    icon: CameraIcon,
    keywords: ["photos", "images"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/gallery"),
  },
];

export const ORGANISER_SEARCH_DESTINATIONS: OrganiserNavItem[] = [
  ...ORGANISER_MAIN_NAV,
  ...ORGANISER_SECONDARY_NAV,
  {
    href: "/organiser/v2/settings",
    label: "Settings",
    icon: Cog6ToothIcon,
    keywords: ["preferences", "stripe", "account"],
    isActive: (pathname) => pathname.startsWith("/organiser/v2/settings"),
  },
];

/**
 * Resolve section crumbs from the pathname. Dynamic entity titles come from
 * OrganiserBreadcrumbContext (pageTitle), not from the URL.
 */
export function resolveOrganiserBreadcrumbs(
  pathname: string,
  pageTitle?: string | null
): OrganiserBreadcrumb[] {
  if (isWelcomeFlowPath(pathname)) {
    if (pathname.startsWith(`${WELCOME_PATH}/event/`)) {
      return [
        crumb("Events", `${WELCOME_PATH}/events`, CalendarIcon),
        crumb(pageTitle?.trim() || "Event"),
      ];
    }
    if (pathname.startsWith(`${WELCOME_PATH}/events`)) {
      return [crumb("Events", undefined, CalendarIcon)];
    }
    return [crumb("Dashboard", undefined, Squares2X2Icon)];
  }

  if (pathname.startsWith("/organiser/v2/dashboard")) {
    return [crumb("Dashboard", undefined, Squares2X2Icon)];
  }

  if (pathname.startsWith("/organiser/v2/settings")) {
    return [crumb("Settings", undefined, Cog6ToothIcon)];
  }

  if (pathname.startsWith("/organiser/v2/forms")) {
    return [crumb("Forms", undefined, PencilSquareIcon)];
  }

  if (pathname.startsWith("/organiser/v2/gallery")) {
    return [crumb("Gallery", undefined, CameraIcon)];
  }

  if (pathname.startsWith("/organiser/v2/event/custom-links")) {
    return [crumb("Custom event links", undefined, LinkIcon)];
  }

  if (pathname.startsWith("/organiser/v2/event/event-collection")) {
    const detail = pathname.match(/^\/organiser\/v2\/event\/event-collection\/([^/]+)/);
    if (detail) {
      return [
        crumb("Event collections", "/organiser/v2/event/event-collection", RectangleStackIcon),
        crumb(pageTitle?.trim() || "Collection"),
      ];
    }
    return [crumb("Event collections", undefined, RectangleStackIcon)];
  }

  if (pathname.startsWith("/organiser/v2/event/recurring-events")) {
    const detail = pathname.match(/^\/organiser\/v2\/event\/recurring-events\/([^/]+)/);
    if (detail) {
      return [
        crumb("Recurring events", "/organiser/v2/event/recurring-events", ArrowPathIcon),
        crumb(pageTitle?.trim() || "Template"),
      ];
    }
    return [crumb("Recurring events", undefined, ArrowPathIcon)];
  }

  if (pathname.startsWith("/organiser/v2/event/dashboard")) {
    return [crumb("Events", undefined, CalendarIcon)];
  }

  if (isEventDetailPage(pathname)) {
    return [
      crumb("Events", "/organiser/v2/event/dashboard", CalendarIcon),
      crumb(pageTitle?.trim() || "Event"),
    ];
  }

  return [crumb("Organiser Hub")];
}
