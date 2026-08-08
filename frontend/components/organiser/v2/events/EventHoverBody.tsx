"use client";

import { HoverMetric, HoverMetrics } from "@/components/organiser/v2/shared/EntityHoverPreview";
import { EventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatViews(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

/** Compact deadline for the KPI strip — weekday if within a week, else short date. */
export function shortDeadlineLabel(ts: Timestamp): string {
  const date = ts.toDate();
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diffMs < 0) {
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      timeZone: "Australia/Sydney",
    });
  }
  if (diffMs < dayMs) return "Today";
  if (diffMs < 2 * dayMs) return "Tomorrow";
  if (diffMs < 7 * dayMs) {
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      timeZone: "Australia/Sydney",
    });
  }
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Sydney",
  });
}

/** Registration close — “Closed” when past. */
export function shortRegCloseLabel(ts: Timestamp): string {
  if (ts.toMillis() < Date.now()) return "Closed";
  return shortDeadlineLabel(ts);
}

type EventHoverBodyProps = {
  event: EventData;
};

/** Cover-led ops strip + description + exception flags — beyond the compact list row. */
export function EventHoverMetrics({ event }: EventHoverBodyProps) {
  // Fill rate already lives on the row — hover covers deadline, end, and views instead.
  return (
    <HoverMetrics>
      <HoverMetric label="Reg closes" value={shortRegCloseLabel(event.registrationDeadline)} />
      <HoverMetric label="Ends" value={shortDeadlineLabel(event.endDate)} />
      <HoverMetric label="Page views" value={formatViews(event.accessCount ?? 0)} />
    </HoverMetrics>
  );
}

export function EventHoverDescription({ event }: EventHoverBodyProps) {
  const description = stripHtml(event.description || "");
  if (!description) return null;
  return <p className="line-clamp-2 leading-relaxed">{description}</p>;
}

export function EventHoverFlags({ event }: EventHoverBodyProps) {
  const flags = [
    event.isPrivate ? "Private" : null,
    event.paused ? "Paused" : null,
    event.waitlistEnabled ? "Waitlist" : null,
    event.bookingApprovalEnabled ? "Approval required" : null,
    event.paymentsActive ? null : "Payments off",
    event.promotionalCodesEnabled ? "Promo codes" : null,
    event.formId ? "Form attached" : null,
  ].filter(Boolean) as string[];

  if (flags.length === 0) return null;
  return <>{flags.join(" · ")}</>;
}

/** @deprecated Prefer composing metrics / description / flags on the row. */
export function EventHoverBody({ event }: EventHoverBodyProps) {
  return (
    <div className="space-y-3">
      <EventHoverMetrics event={event} />
      <EventHoverDescription event={event} />
    </div>
  );
}
