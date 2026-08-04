"use client";

import { WeeklyTicketBucket } from "@/services/src/organiser/organiserDashboardMetricsService";
import { useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

type WeeklyTicketsChartProps = {
  weeklyTickets: WeeklyTicketBucket[];
  loading: boolean;
};

type RangeKey = "1W" | "4W";

export function WeeklyTicketsChart({ weeklyTickets, loading }: WeeklyTicketsChartProps) {
  const [range, setRange] = useState<RangeKey>("4W");
  const [rangeAnimating, setRangeAnimating] = useState(false);

  const buckets = useMemo(
    () => (range === "1W" ? weeklyTickets.slice(-1) : weeklyTickets),
    [range, weeklyTickets],
  );

  const maxTickets = Math.max(...buckets.map((bucket) => bucket.tickets), 1);
  const totalTickets = buckets.reduce((sum, bucket) => sum + bucket.tickets, 0);
  const isEmpty = buckets.length === 0 || buckets.every((bucket) => bucket.tickets === 0);

  const handleRangeChange = (key: RangeKey) => {
    if (key === range) return;
    setRangeAnimating(true);
    setRange(key);
    window.setTimeout(() => setRangeAnimating(false), 320);
  };

  return (
    <div className="rounded-xl border border-border bg-background p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-sans text-base font-semibold text-foreground">Ticket sales</h2>
          <p className="text-xs text-foreground-muted font-sans mt-0.5">
            {loading ? "Loading weekly totals…" : `${totalTickets} tickets in view`}
          </p>
        </div>
        <div
          className="flex rounded-lg bg-surface p-0.5 shrink-0"
          role="group"
          aria-label="Chart range"
        >
          {(["1W", "4W"] as RangeKey[]).map((key) => (
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
              {key === "1W" ? "This week" : "4 weeks"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1 min-h-[8.5rem]">
        {loading ? (
          <Skeleton height={136} className="rounded-lg" />
        ) : isEmpty ? (
          <div className="h-full min-h-[8.5rem] flex flex-col items-center justify-center rounded-lg bg-surface px-4 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">No ticket sales yet</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans max-w-[22rem]">
              Sales for the selected period will appear here once players book.
            </p>
          </div>
        ) : (
          <div
            className={`h-full min-h-[8.5rem] flex items-end justify-between gap-2 sm:gap-3 px-0.5 transition-opacity duration-300 ease-out ${
              rangeAnimating ? "opacity-70" : "opacity-100"
            }`}
            role="img"
            aria-label={`Weekly ticket sales: ${buckets.map((b) => `${b.label} ${b.tickets}`).join(", ")}`}
          >
            {buckets.map((bucket) => {
              const heightPercent = Math.max(10, (bucket.tickets / maxTickets) * 100);
              return (
                <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold tabular-nums text-foreground font-sans">
                    {bucket.tickets}
                  </span>
                  <div className="w-full h-24 sm:h-28 flex items-end justify-center">
                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-[height] duration-300 ease-out ${
                        bucket.isCurrent ? "bg-accent" : "bg-surface-muted"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground-muted font-sans">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
