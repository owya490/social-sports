"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { Frequency } from "@/interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";
import Skeleton from "react-loading-skeleton";

/**
 * Quiet Luma-style header for recurrence templates — twin of EventHubHeader.
 * THESIS: Series identity in header meta; Template chip replaces Event page.
 */

function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case Frequency.WEEKLY:
      return "Weekly";
    case Frequency.FORTNIGHTLY:
      return "Fortnightly";
    case Frequency.MONTHLY:
      return "Monthly";
    default:
      return frequency;
  }
}

function nextOccurrenceLabel(startDate: Timestamp): string {
  const date = startDate.toDate();
  const weekday = date.toLocaleString("en-AU", { weekday: "short" });
  const time = date.toLocaleString("en-AU", { hour: "numeric", minute: "2-digit" });
  return `Next ${weekday} ${time}`;
}

type RecurringHubHeaderProps = {
  loading: boolean;
  name: string;
  startDate: Timestamp;
  location: string;
  frequency: Frequency;
};

export function RecurringHubHeader({
  loading,
  name,
  startDate,
  location,
  frequency,
}: RecurringHubHeaderProps) {
  const meta = loading
    ? ""
    : [frequencyLabel(frequency), nextOccurrenceLabel(startDate), location].filter(Boolean).join(" · ");
  useOrganiserBreadcrumbTitle(loading ? null : name);

  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-3">
      <OrganiserBreadcrumbs />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton height={28} width="70%" />
          ) : (
            <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
              {name}
            </h1>
          )}
          <div className="mt-1.5 text-xs text-foreground-muted font-sans">
            {loading ? <Skeleton width={240} height={14} /> : <p className="truncate">{meta}</p>}
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground-secondary font-sans">
          Template
        </span>
      </div>
    </header>
  );
}
