"use client";

import { EventData, EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getAllEvents } from "@/services/src/events/eventsService";
import { resolveEventInventory } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { useEffect, useState } from "react";

// Events published under the SPORTSHUB account are listings we host for others; organiser-run sessions
// make better proof, so they are preferred when choosing what to feature.
const SPORTSHUB_ORGANISER_ID = "ZzuRS5v8hhWonnp2qdIOZG8R7f12";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LISTED_SESSIONS = 16;

const logger = new Logger("LandingLiveSessions");

export type LiveSession = {
  eventId: EventId;
  name: string;
  hostName: string;
  isSportshubListing: boolean;
  start: Date;
  suburb: string;
  priceCents: number;
  capacity: number;
  vacancy: number;
  hideVacancy: boolean;
  image: string;
  sport: string;
};

export type LiveSessionsState = {
  status: "loading" | "ready" | "error";
  sessions: LiveSession[];
  weekCount: number;
  featured: LiveSession | null;
};

const SUBURB_PATTERN = /,\s*([^,]+?)\s+(?:NSW|VIC|QLD|ACT|SA|WA|TAS|NT)\b/;

export function suburbFromLocation(location: string): string {
  const match = location.match(SUBURB_PATTERN);
  if (match) return match[1].trim();
  const parts = location.split(",").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 2] : parts[0] ?? "";
}

function toLiveSession(event: EventData): LiveSession {
  const inventory = resolveEventInventory(event);
  const hostName = `${event.organiser?.firstName ?? ""} ${event.organiser?.surname ?? ""}`.trim();
  return {
    eventId: event.eventId,
    name: event.name,
    hostName: hostName || "SPORTSHUB",
    isSportshubListing: event.organiserId === SPORTSHUB_ORGANISER_ID,
    start: event.startDate.toDate(),
    suburb: suburbFromLocation(event.location ?? ""),
    priceCents: inventory.price,
    capacity: inventory.capacity,
    vacancy: inventory.vacancy,
    hideVacancy: Boolean(event.hideVacancy),
    image: event.thumbnail || event.image || "",
    sport: event.sport ?? "",
  };
}

export function selectLiveSessions(events: EventData[], now: Date): Omit<LiveSessionsState, "status"> {
  const upcoming = events
    .filter((event) => typeof event.startDate?.toDate === "function" && !event.isPrivate && !event.paused)
    .map(toLiveSession)
    .filter((session) => session.start.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const weekEnd = now.getTime() + WEEK_MS;
  const thisWeek = upcoming.filter((session) => session.start.getTime() <= weekEnd);
  const pool = thisWeek.length >= 4 ? thisWeek : upcoming;
  const organiserRun = pool.filter((session) => !session.isSportshubListing);
  const sessions = [...organiserRun, ...pool.filter((session) => session.isSportshubListing)]
    .slice(0, MAX_LISTED_SESSIONS)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const featured =
    upcoming.find((session) => !session.isSportshubListing && session.priceCents > 0 && session.name.length <= 56) ??
    upcoming.find((session) => session.priceCents > 0) ??
    null;

  return { sessions, weekCount: thisWeek.length, featured };
}

export function useLiveSessions(): LiveSessionsState {
  const [state, setState] = useState<LiveSessionsState>({
    status: "loading",
    sessions: [],
    weekCount: 0,
    featured: null,
  });

  useEffect(() => {
    let cancelled = false;
    getAllEvents()
      .then((events) => {
        if (cancelled) return;
        setState({ status: "ready", ...selectLiveSessions(events, new Date()) });
      })
      .catch((error) => {
        logger.error(`Failed to load live sessions for landing: ${error}`);
        if (!cancelled) setState({ status: "error", sessions: [], weekCount: 0, featured: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function formatSessionDay(date: Date): string {
  const showYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(showYear ? { year: "numeric" } : {}),
  });
}

export function formatSessionTime(date: Date): string {
  return date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(" ", " ");
}
