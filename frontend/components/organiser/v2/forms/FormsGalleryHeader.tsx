"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type FormsGalleryHeaderProps = {
  formCount: number;
  loading: boolean;
};

export function FormsGalleryHeader({ formCount, loading }: FormsGalleryHeaderProps) {
  const subtitle = loading
    ? "Loading your forms…"
    : formCount === 0
      ? "Build forms for bookings and check-ins"
      : `${formCount} form${formCount === 1 ? "" : "s"} ready to attach`;

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Forms
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
        </div>
        <Link
          href="/organiser/forms/create-form/editor?returnTo=/organiser/v2/forms/gallery"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans shrink-0 hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Create form
        </Link>
      </div>
    </header>
  );
}
