"use client";

import { ActivityFeedItem } from "@/services/src/organiser/organiserDashboardMetricsService";
import { OrderAndTicketType } from "@/interfaces/OrderTypes";
import { DASHBOARD_CHART_ROW_HEIGHT } from "@/components/organiser/v2/dashboard/WeeklyTicketsChart";
import { SignalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

type ActivityFeedSectionProps = {
  activity: ActivityFeedItem[];
  loading: boolean;
};

const VISIBLE_ACTIVITY_COUNT = 5;

function formatFeedTimestamp(seconds: number, nowSeconds: number): string {
  const diff = Math.max(0, nowSeconds - seconds);

  if (diff < 86400) {
    const date = new Date(seconds * 1000);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const date = new Date(seconds * 1000);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function actionLabel(type: OrderAndTicketType): string {
  return type === OrderAndTicketType.MANUAL ? "manual add" : "purchase";
}

function ActivityRow({
  item,
  nowSeconds,
  isLast,
}: {
  item: ActivityFeedItem;
  nowSeconds: number;
  isLast: boolean;
}) {
  return (
    <Link
      href={`/organiser/v2/event/${item.eventId}`}
      className="group grid min-w-0 grid-cols-[2.75rem_0.75rem_1fr] gap-x-2 rounded-lg hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <time
        dateTime={new Date(item.purchaseDate.seconds * 1000).toISOString()}
        className="pt-1 font-mono text-xs tabular-nums text-foreground-muted leading-none"
      >
        {formatFeedTimestamp(item.purchaseDate.seconds, nowSeconds)}
      </time>

      <div className="flex flex-col items-center pt-1.5" aria-hidden>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-secondary group-hover:bg-foreground transition-colors" />
        {!isLast ? <span className="mt-1 w-px flex-1 min-h-[1.25rem] bg-border" /> : null}
      </div>

      <div className={`min-w-0 ${isLast ? "pb-0" : "pb-3"}`}>
        <span className="font-mono text-xs uppercase tracking-wide text-foreground-muted">
          {actionLabel(item.type)}
        </span>
        <p className="mt-1 text-xs text-foreground font-sans leading-snug truncate">
          <span className="font-semibold">{item.purchaserName}</span>
          <span className="text-foreground-muted"> → </span>
          <span className="text-foreground-secondary group-hover:text-foreground transition-colors">
            {item.eventName}
          </span>
        </p>
      </div>
    </Link>
  );
}

export function ActivityFeedSection({ activity, loading }: ActivityFeedSectionProps) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const visibleActivity = activity.slice(0, VISIBLE_ACTIVITY_COUNT);

  return (
    <section
      className="rounded-xl border border-border bg-background p-4 sm:p-5 w-full flex flex-col overflow-hidden"
      style={{ height: DASHBOARD_CHART_ROW_HEIGHT }}
      aria-label="Activity feed"
    >
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-sans text-base font-semibold text-foreground">Activity feed</h2>
          <span className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs uppercase tracking-wide text-foreground-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground-secondary" aria-hidden />
            Live
          </span>
        </div>
        <Link
          href="/organiser/v2/event/dashboard"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          View all
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-x-hidden">
        {loading ? (
          <div className="space-y-3 flex-1">
            <Skeleton height={52} className="rounded-lg" />
            <Skeleton height={52} className="rounded-lg" />
            <Skeleton height={52} className="rounded-lg" />
          </div>
        ) : visibleActivity.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-surface px-4 py-6 text-center">
            <SignalIcon className="h-5 w-5 text-foreground-muted" aria-hidden />
            <p className="mt-2 font-mono text-xs uppercase tracking-wide text-foreground-muted">
              No events in stream
            </p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">
              Ticket purchases and manual adds will appear here.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            {visibleActivity.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                nowSeconds={nowSeconds}
                isLast={index === visibleActivity.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
