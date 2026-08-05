"use client";

import { EventId } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import {
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { EventHubShareControl } from "./EventHubShareControl";

type EventHubChromeProps = {
  loading: boolean;
  eventId: EventId;
  name: string;
  startDate: Timestamp;
  location: string;
  image: string;
  filled: number;
  capacity: number;
  paused: boolean;
  isActive: boolean;
  isPrivate: boolean;
  paymentsActive: boolean;
  onTogglePause: () => void;
  pauseUpdating?: boolean;
};

function StatusDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-secondary font-sans">
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${
          on ? "bg-foreground" : "bg-surface-muted border border-border"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function EventHubChrome({
  loading,
  eventId,
  name,
  startDate,
  location,
  image,
  filled,
  capacity,
  paused,
  isActive,
  isPrivate,
  paymentsActive,
  onTogglePause,
  pauseUpdating = false,
}: EventHubChromeProps) {
  const percent = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;
  const live = isActive && !paused;

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 max-w-6xl mx-auto">
      <div className="mb-3">
        <Link
          href="/organiser/v2/event/dashboard"
          className="text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          ← Events
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-stretch">
        {/* Constrained 16:9 — sits beside metadata so the row fills the chrome */}
        <div className="w-full sm:w-[15rem] md:w-[17rem] lg:w-[19rem] shrink-0">
          {loading ? (
            <Skeleton className="!rounded-xl aspect-video w-full" />
          ) : (
            <div
              className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-muted bg-cover bg-center"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
              role="img"
              aria-label={name ? `${name} banner` : "Event banner"}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {loading ? (
                <Skeleton height={28} width="70%" />
              ) : (
                <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                  {name}
                </h1>
              )}

              <div className="mt-1.5 flex flex-col gap-1 text-xs text-foreground-muted font-sans">
                {loading ? (
                  <Skeleton width={200} height={14} />
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{timestampToEventCardDateString(startDate)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <Link
                href={`/event/${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-lg px-1.5 py-1"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
                Preview
              </Link>
              <EventHubShareControl eventId={eventId} />
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
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          <div className="mt-auto pt-3 space-y-2.5">
            <div className="flex items-center gap-3">
              <div
                className="h-1 flex-1 rounded-full bg-surface-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${percent}% full`}
              >
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {loading ? (
                <Skeleton width={96} height={14} />
              ) : (
                <span className="text-xs tabular-nums text-foreground-muted font-sans shrink-0">
                  {filled}/{capacity} registered · {percent}% full
                </span>
              )}
            </div>

            {!loading ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <StatusDot on={live} label={live ? "Live" : paused ? "Paused" : "Inactive"} />
                <StatusDot on={!isPrivate} label={isPrivate ? "Private" : "Public"} />
                <StatusDot on={paymentsActive} label={paymentsActive ? "Payments on" : "Payments off"} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
