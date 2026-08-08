"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { Frequency } from "@/interfaces/RecurringEventTypes";
import { PauseCircleIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
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
  paused: boolean;
  isActive: boolean;
  onTogglePause: () => void;
  pauseUpdating?: boolean;
};

export function RecurringHubHeader({
  loading,
  name,
  startDate,
  location,
  frequency,
  paused,
  isActive,
  onTogglePause,
  pauseUpdating = false,
}: RecurringHubHeaderProps) {
  const meta = loading
    ? ""
    : [frequencyLabel(frequency), nextOccurrenceLabel(startDate), location].filter(Boolean).join(" · ");
  useOrganiserBreadcrumbTitle(loading ? null : name);

  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-3 max-lg:pl-14">
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

        <div className="flex items-center gap-0.5 shrink-0">
          <span className="inline-flex items-center rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground-secondary font-sans">
            Template
          </span>
          <button
            type="button"
            onClick={onTogglePause}
            disabled={loading || pauseUpdating || !isActive}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-lg px-1.5 py-1"
          >
            {paused ? (
              <PlayCircleIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <PauseCircleIcon className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
