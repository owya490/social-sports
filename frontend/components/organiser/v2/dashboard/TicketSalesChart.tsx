"use client";

import { DailyTicketBucket } from "@/services/src/organiser/organiserDashboardMetricsService";
import { useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

type TicketSalesChartProps = {
  weekTickets: DailyTicketBucket[];
  monthTickets: DailyTicketBucket[];
  loading: boolean;
};

type RangeKey = "week" | "month";

/** Shared with ActivityFeedSection — ~3/4 of the previous content-driven height. */
export const DASHBOARD_CHART_ROW_HEIGHT = "18rem";

function DayBarTooltip({
  bucket,
  showWeekday,
}: {
  bucket: DailyTicketBucket;
  showWeekday: boolean;
}) {
  return (
    <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-max max-w-[12rem] -translate-x-1/2 rounded-lg border border-border bg-background px-2.5 py-2 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <p className="text-xs font-semibold text-foreground font-sans">
        {showWeekday ? `${bucket.weekdayLabel} · ${bucket.dateLabel}` : bucket.dateLabel}
      </p>
      <p className="mt-0.5 text-xs text-foreground-muted font-sans tabular-nums">
        {bucket.tickets} ticket{bucket.tickets === 1 ? "" : "s"}
      </p>
      {bucket.events.length > 0 ? (
        <ul className="mt-1.5 space-y-1 border-t border-border pt-1.5">
          {bucket.events.slice(0, 4).map((event) => (
            <li
              key={event.eventId}
              className="flex items-start justify-between gap-2 text-xs font-sans leading-snug"
            >
              <span className="text-foreground-secondary truncate">{event.eventName}</span>
              <span className="tabular-nums text-foreground shrink-0">{event.tickets}</span>
            </li>
          ))}
          {bucket.events.length > 4 ? (
            <li className="text-xs text-foreground-muted font-sans">
              +{bucket.events.length - 4} more
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function TicketSalesChart({ weekTickets, monthTickets, loading }: TicketSalesChartProps) {
  const [range, setRange] = useState<RangeKey>("week");
  const [rangeAnimating, setRangeAnimating] = useState(false);

  const isMonth = range === "month";
  const buckets = isMonth ? monthTickets : weekTickets;
  const maxTickets = Math.max(...buckets.map((bucket) => bucket.tickets), 1);
  const totalTickets = buckets.reduce((sum, bucket) => sum + bucket.tickets, 0);
  const isEmpty = buckets.length === 0 || buckets.every((bucket) => bucket.tickets === 0);

  const subtitle = useMemo(() => {
    if (loading) return "Loading daily totals…";
    if (range === "week") return `${totalTickets} tickets · last 7 days`;
    return `${totalTickets} tickets · last 30 days`;
  }, [loading, range, totalTickets]);

  const handleRangeChange = (key: RangeKey) => {
    if (key === range) return;
    setRangeAnimating(true);
    setRange(key);
    window.setTimeout(() => setRangeAnimating(false), 320);
  };

  return (
    <div
      className="rounded-xl border border-border bg-background p-4 sm:p-5 w-full flex flex-col overflow-visible"
      style={{ height: DASHBOARD_CHART_ROW_HEIGHT }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
        <div>
          <h2 className="font-sans text-base font-semibold text-foreground">Ticket sales</h2>
          <p className="text-xs text-foreground-muted font-sans mt-0.5">{subtitle}</p>
        </div>
        <div
          className="flex rounded-lg bg-surface p-0.5 shrink-0"
          role="group"
          aria-label="Chart range"
        >
          {(
            [
              { key: "week", label: "Last week" },
              { key: "month", label: "Last 30 days" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleRangeChange(key)}
              aria-pressed={range === key}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus ${
                range === key
                  ? "bg-foreground text-background"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-visible">
        {loading ? (
          <Skeleton className="h-full rounded-lg" />
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg bg-surface px-4 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">No ticket sales yet</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans max-w-[22rem]">
              Sales for the selected period will appear here once players book.
            </p>
          </div>
        ) : (
          <div
            className={`h-full flex items-end justify-between gap-0.5 sm:gap-1 px-0.5 overflow-visible transition-opacity duration-300 ease-out ${
              rangeAnimating ? "opacity-70" : "opacity-100"
            }`}
            role="img"
            aria-label={`Daily ticket sales ${isMonth ? "last 30 days" : "last week"}: ${buckets
              .map((b) => `${b.dateLabel} ${b.tickets}`)
              .join(", ")}`}
          >
            {buckets.map((bucket, index) => {
              const heightPercent =
                bucket.tickets === 0 ? 4 : Math.max(8, (bucket.tickets / maxTickets) * 100);
              const showMonthLabel = isMonth && index % 5 === 0;
              return (
                <div
                  key={bucket.dateKey}
                  className={`group relative flex-1 flex flex-col items-center min-w-0 h-full ${
                    isMonth ? "gap-1" : "gap-1.5"
                  }`}
                >
                  <DayBarTooltip bucket={bucket} showWeekday={!isMonth} />
                  {!isMonth ? (
                    <span className="text-xs font-semibold tabular-nums text-foreground font-sans leading-none">
                      {bucket.tickets}
                    </span>
                  ) : null}
                  <div className="w-full flex-1 flex items-end justify-center min-h-0">
                    <div
                      className={`w-full rounded-t-sm transition-[height] duration-300 ease-out ${
                        isMonth ? "max-w-none" : "max-w-12 rounded-t-md"
                      } group-hover:brightness-95`}
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: bucket.isCurrent
                          ? "var(--color-accent)"
                          : "color-mix(in srgb, var(--color-accent) 28%, var(--color-surface-muted))",
                      }}
                    />
                  </div>
                  {isMonth ? (
                    <span className="relative h-4 w-full shrink-0">
                      {showMonthLabel ? (
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 font-mono text-xs font-medium text-foreground-muted leading-none whitespace-nowrap">
                          {bucket.dateLabel}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-medium text-foreground-muted leading-none truncate max-w-full">
                      {bucket.weekdayLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
