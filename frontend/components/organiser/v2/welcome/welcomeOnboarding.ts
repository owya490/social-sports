export const WELCOME_PATH = "/organiser/v2/welcome";
export const WELCOME_EVENTS_PATH = `${WELCOME_PATH}/events`;
export const DASHBOARD_PATH = "/organiser/v2/dashboard";
export const EVENTS_LIST_PATH = "/organiser/v2/event/dashboard";
export const CREATE_EVENT_PATH = "/event/create";
export const WELCOME_SEEN_KEY = "organiser-v2-welcome-seen";
export const TOUR_SESSION_KEY = "organiser-v2-tour-session";

export type TourStep = {
  id: string;
  target: string;
  title: string;
  body: string;
  /** User must click the spotlighted control to continue. */
  interaction?: "next" | "click-through";
  clickHint?: string;
  /** When false, don't scroll the page to the target (avoids jump on above-the-fold UI). */
  scroll?: boolean;
};

/** Hub tour on the welcome twin of the dashboard. */
export const HUB_STEPS: TourStep[] = [
  {
    id: "nav",
    target: "[data-tour='organiser-sidebar']",
    title: "Your whole hub, one tap away",
    body: "Dashboard, events, forms, gallery — the sidebar is where you find your way around.",
    interaction: "next",
  },
  {
    id: "kpis",
    target: "[data-tour='dashboard-kpis']",
    title: "The pulse of your sessions",
    body: "Sales, tickets, views — the numbers that matter, right up top.",
    interaction: "next",
  },
  {
    id: "create",
    target: "[data-tour='create-event']",
    title: "Spin up a session fast",
    body: "Create event lives right here — one tap from the dashboard when you’re ready to publish.",
    interaction: "next",
  },
];

/** After hub: invite the organiser to open Events themselves. */
export const CLICK_EVENTS_NAV_STEP: TourStep = {
  id: "click-events-nav",
  target: "[data-tour='nav-events']",
  title: "Teach me about events",
  body: "Your catalogue lives under Events. Open it from the sidebar to keep going.",
  interaction: "click-through",
  clickHint: "Click Events in the sidebar",
};

/** Events catalogue intro — toolbar first (no scroll jump), then the list. */
export const EVENTS_INTRO_STEPS: TourStep[] = [
  {
    id: "events-toolbar",
    target: "[data-tour='events-toolbar']",
    title: "Find the right session",
    body: "Search, filter by time, and sort — your toolbar keeps a long catalogue usable.",
    interaction: "next",
    scroll: false,
  },
  {
    id: "events-list",
    target: "[data-tour='events-list']",
    title: "Every session in one list",
    body: "This is your catalogue. Open any row to step into that event’s hub.",
    interaction: "next",
    scroll: false,
  },
];

export const CLICK_EVENT_STEP: TourStep = {
  id: "click-event",
  target: "[data-tour='events-list']",
  title: "Open a session",
  body: "Pick any event in the list to step inside its hub — where registrations, forms, and settings live.",
  interaction: "click-through",
  clickHint: "Click an event to open it",
  scroll: false,
};

export const CREATE_EVENT_STEP: TourStep = {
  id: "create-event",
  target: "[data-tour='create-event']",
  title: "Create your first session",
  body: "You don’t have an event yet. Start one here — then come back to finish the tour.",
  interaction: "click-through",
  clickHint: "Click Create event",
  scroll: false,
};

export const EVENT_HUB_STEPS: TourStep[] = [
  {
    id: "event-hub-nav",
    target: "[data-tour='event-hub-nav']",
    title: "One event, many jobs",
    body: "Details, registrations, forms, settings — all in one place for this session.",
    interaction: "next",
  },
  {
    id: "event-hub-overview",
    target: "[data-tour='event-hub-overview']",
    title: "The new event desk",
    body: "Preview, edit, and run the session without leaving this hub.",
    interaction: "next",
  },
];

export type TourChapter =
  | "hub"
  | "click-events-nav"
  | "events-intro"
  | "click-event"
  | "create-event"
  | "event-hub";

export type TourSession = {
  chapter: TourChapter;
  eventId?: string;
};

export function isWelcomeFlowPath(pathname: string): boolean {
  return pathname === WELCOME_PATH || pathname.startsWith(`${WELCOME_PATH}/`);
}

export function isWelcomeRootPath(pathname: string): boolean {
  return pathname === WELCOME_PATH || pathname === `${WELCOME_PATH}/`;
}

export function isWelcomeEventsPath(pathname: string): boolean {
  return pathname === WELCOME_EVENTS_PATH || pathname.startsWith(`${WELCOME_EVENTS_PATH}/`);
}

export function isWelcomeEventHubPath(pathname: string): boolean {
  const match = pathname.match(new RegExp(`^${WELCOME_PATH}/event/([^/]+)$`));
  return Boolean(match?.[1]);
}

export function welcomeEventPath(eventId: string): string {
  return `${WELCOME_PATH}/event/${eventId}`;
}

/** Remap organiser nav hrefs while the welcome flow is active. */
export function welcomeAwareHref(pathname: string, href: string): string {
  if (!isWelcomeFlowPath(pathname)) return href;
  if (href === DASHBOARD_PATH || href === WELCOME_PATH) return WELCOME_PATH;
  if (href === EVENTS_LIST_PATH) return WELCOME_EVENTS_PATH;
  return href;
}

export function welcomeAwareEventHref(pathname: string, eventId: string): string {
  if (isWelcomeFlowPath(pathname)) return welcomeEventPath(eventId);
  return `/organiser/v2/event/${eventId}`;
}

export function welcomeAwareEventsListHref(pathname: string): string {
  return isWelcomeFlowPath(pathname) ? WELCOME_EVENTS_PATH : EVENTS_LIST_PATH;
}

export function hasSeenWelcome(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(): void {
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    // ignore
  }
}

export function readTourSession(): TourSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TOUR_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TourSession;
  } catch {
    return null;
  }
}

export function writeTourSession(session: TourSession): void {
  try {
    window.sessionStorage.setItem(TOUR_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearTourSession(): void {
  try {
    window.sessionStorage.removeItem(TOUR_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function findFirstEventId(): string | null {
  const marked = document.querySelector("[data-event-id]");
  if (marked instanceof HTMLElement) {
    const id = marked.getAttribute("data-event-id");
    if (id) return id;
  }
  return null;
}

export function hasTourEvents(): boolean {
  return Boolean(document.querySelector("[data-event-id]"));
}

/** Ask the mobile organiser drawer to open so nav-events is reachable. */
export const WELCOME_OPEN_MENU_EVENT = "organiser-welcome-open-menu";

export function requestWelcomeMenuOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WELCOME_OPEN_MENU_EVENT));
}

export const LOADING_MS = 3200;
export const LOADING_MS_REDUCED = 500;

/** Spoken beats on the black learning stage — orient, don’t entertain. */
export const LOADING_BEATS = [
  "Learning your hub…",
  "Mapping the sidebar…",
  "Tuning the event desk…",
  "Almost ready…",
] as const;
