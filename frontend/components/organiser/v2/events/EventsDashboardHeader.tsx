"use client";

import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

type EventsDashboardHeaderProps = {
  eventCount: number;
  loading: boolean;
};

export function EventsDashboardHeader({ eventCount, loading }: EventsDashboardHeaderProps) {
  const subtitle = loading
    ? "Loading your sessions…"
    : eventCount === 0
      ? "Publish a session to start filling spots"
      : `${eventCount} session${eventCount === 1 ? "" : "s"} in your catalogue`;

  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 max-lg:pl-14 pb-4">
      <OrganiserBreadcrumbs />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Your events
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
        </div>
        <Link
          href="/event/create"
          data-tour="create-event"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans shrink-0 hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Create event
        </Link>
      </div>
    </header>
  );
}
