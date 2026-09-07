"use client";

import { EventId } from "@/interfaces/EventTypes";
import { RecurrenceOccurrence } from "@/interfaces/RecurringEventTypes";
import { ArrowTopRightOnSquareIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { EventHubEmpty, EventHubStage } from "@/components/organiser/v2/event-hub/EventHubStage";

type RecurringHubPastEventsProps = {
  pastEvents: Record<string, EventId>;
  occurrences?: RecurrenceOccurrence[];
};

function toDate(dateString: string) {
  const isoDateString = dateString.replace(" ", "T").replace(" GMT", "").concat(":00");
  return new Date(isoDateString);
}

function formatStart(dateString: string) {
  const date = toDate(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecurringHubPastEvents({ pastEvents, occurrences }: RecurringHubPastEventsProps) {
  const rows = occurrences
    ? occurrences
        .filter((occurrence) => occurrence.eventId)
        .sort((a, b) => a.eventStart.toMillis() - b.eventStart.toMillis())
        .map((occurrence) => ({
          key: occurrence.occurrenceId,
          label: occurrence.eventStart.toDate().toLocaleString("en-AU", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          eventId: occurrence.eventId as EventId,
        }))
    : Object.entries(pastEvents)
        .sort((a, b) => toDate(a[0]).getTime() - toDate(b[0]).getTime())
        .map(([startKey, eventId]) => ({
          key: `${startKey}-${eventId}`,
          label: formatStart(startKey),
          eventId,
        }));

  return (
    <EventHubStage>
      {rows.length === 0 ? (
        <EventHubEmpty>No occurrences have been created from this template yet.</EventHubEmpty>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                  aria-hidden
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground font-sans">{row.label}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted font-sans truncate font-mono">{row.eventId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 sm:pl-0">
                <Link
                  href={`/organiser/v2/event/${row.eventId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Organiser
                </Link>
                <a
                  href={`/event/${row.eventId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Event page
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </EventHubStage>
  );
}
