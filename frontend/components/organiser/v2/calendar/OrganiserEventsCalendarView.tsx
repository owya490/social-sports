"use client";

import { OrganiserMonthCalendar } from "@/components/organiser/v2/calendar/OrganiserMonthCalendar";
import {
  groupEventsByDayKey,
  startOfMonth,
  toCalendarDayEvent,
} from "@/components/organiser/v2/calendar/calendarUtils";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { useUser } from "@/components/utility/UserContext";
import { EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { addMonths, subMonths } from "date-fns";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

const logger = new Logger("OrganiserEventsCalendar");

export function OrganiserEventsCalendarView() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user.userId === "") return;
      setError(false);
      setLoading(true);
      try {
        const events = await getOrganiserEvents(user.userId);
        setAllEvents(events);
      } catch (fetchError) {
        logger.error(`Failed to get organiser events for calendar: ${fetchError}`);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user.userId]);

  const eventsByDay = useMemo(() => {
    const calendarEvents = allEvents.map(toCalendarDayEvent);
    return groupEventsByDayKey(calendarEvents);
  }, [allEvents]);

  const monthEventCount = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    let count = 0;
    for (const [key, list] of eventsByDay) {
      if (key.startsWith(prefix)) count += list.length;
    }
    return count;
  }, [eventsByDay, month]);

  const subtitle = loading
    ? "Loading your sessions…"
    : error
      ? "Could not load events"
      : monthEventCount === 0
        ? "No sessions this month"
        : `${monthEventCount} session${monthEventCount === 1 ? "" : "s"} this month`;

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <header className="mx-auto max-w-6xl px-4 pb-4 pt-5 max-lg:pl-14 sm:px-6 sm:pt-7 lg:px-8">
        <OrganiserBreadcrumbs />
        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            Calendar
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground-secondary">{subtitle}</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-border bg-background p-6 text-center">
            <p className="font-sans text-sm font-semibold text-foreground">Could not load your calendar</p>
            <p className="mt-1 font-sans text-xs text-foreground-muted">
              Refresh the page, or try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setLoading(true);
                getOrganiserEvents(user.userId)
                  .then(setAllEvents)
                  .catch((fetchError) => {
                    logger.error(`Retry failed: ${fetchError}`);
                    setError(true);
                  })
                  .finally(() => setLoading(false));
              }}
              className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Try again
            </button>
          </div>
        ) : (
          <OrganiserMonthCalendar
            month={month}
            eventsByDay={eventsByDay}
            loading={loading}
            onToday={() => setMonth(startOfMonth(new Date()))}
            onPrevMonth={() => setMonth((prev) => startOfMonth(subMonths(prev, 1)))}
            onNextMonth={() => setMonth((prev) => startOfMonth(addMonths(prev, 1)))}
          />
        )}

        {!error && !loading && allEvents.length === 0 ? (
          <p className="mt-4 font-sans text-sm text-foreground-muted">
            Publish a session and it will show up here by date. Click any session to open its event hub.
          </p>
        ) : null}
      </div>
    </div>
  );
}
