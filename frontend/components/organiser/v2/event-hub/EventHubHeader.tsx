"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EventId } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import {
  ArrowTopRightOnSquareIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

/**
 * Quiet Luma-style header — title + meta + Event page. Cover lives in Details.
 */

type EventHubHeaderProps = {
  loading: boolean;
  eventId: EventId;
  name: string;
  startDate: Timestamp;
  location: string;
  paused: boolean;
  isActive: boolean;
  onTogglePause: () => void;
  pauseUpdating?: boolean;
};

export function EventHubHeader({
  loading,
  eventId,
  name,
  startDate,
  location,
  paused,
  isActive,
  onTogglePause,
  pauseUpdating = false,
}: EventHubHeaderProps) {
  useOrganiserBreadcrumbTitle(loading ? null : name);
  const meta = loading
    ? ""
    : [timestampToEventCardDateString(startDate), location].filter(Boolean).join(" · ");

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
          <Link
            href={`/event/${eventId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Event page
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
          </Link>
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
