"use client";

import { TopEventRow } from "@/services/src/organiser/organiserDashboardMetricsService";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

type TopEventsSectionProps = {
  topEvents: TopEventRow[];
  loading: boolean;
};

export function TopEventsSection({ topEvents, loading }: TopEventsSectionProps) {
  const hasData = topEvents.some((event) => event.ticketsSold > 0);

  return (
    <section aria-label="Top events by tickets sold" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">Top events</h2>
            <p className="text-xs text-foreground-muted font-sans mt-0.5">By total tickets sold</p>
          </div>
          <Link
            href="/organiser/event/dashboard"
            className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0"
          >
            Manage
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton height={44} className="rounded-lg" />
            <Skeleton height={44} className="rounded-lg" />
            <Skeleton height={44} className="rounded-lg" />
          </div>
        ) : !hasData ? (
          <p className="text-sm text-foreground-muted font-sans py-2">
            Ticket totals will rank here once events start selling.
          </p>
        ) : (
          <ol className="space-y-2">
            {topEvents.map((event, index) => (
              <li key={event.eventId}>
                <Link
                  href={`/organiser/event/${event.eventId}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="w-5 text-xs font-semibold tabular-nums text-foreground-muted font-sans shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground font-sans truncate">{event.name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground-secondary"
                          style={{ width: `${event.fillPercent}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-foreground-muted font-sans shrink-0">
                        {event.ticketsSold} sold · {event.fillPercent}%
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
