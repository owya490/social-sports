"use client";

import { PlusIcon } from "@heroicons/react/24/outline";

type CustomLinksHeaderProps = {
  linkCount: number;
  loading: boolean;
  username: string;
  onAdd: () => void;
};

export function CustomLinksHeader({ linkCount, loading, username, onAdd }: CustomLinksHeaderProps) {
  const subtitle = loading
    ? "Loading your links…"
    : linkCount === 0
      ? "Share a short vanity URL for any session"
      : `${linkCount} custom link${linkCount === 1 ? "" : "s"} · /event/${username || "you"}/…`;

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Custom event links
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans shrink-0 hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Add link
        </button>
      </div>
    </header>
  );
}
