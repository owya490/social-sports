"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export type EntityListEmptyVariant = "empty" | "search";

type EntityListEmptyStateProps = {
  /** `empty` = catalogue has no items; `search` = items exist but none match search/filters. */
  variant: EntityListEmptyVariant;
  title: string;
  description: string;
  /** Leading icon for the empty catalogue. Search variant defaults to a magnifying glass. */
  icon?: IconComponent;
  /** Primary recovery action (Create, Clear search, etc.). */
  children?: ReactNode;
};

/**
 * Shared empty / empty-search shell for organiser v2 catalogue lists.
 * Matches the outlined panel language used by events, recurring templates, and custom links.
 */
export function EntityListEmptyState({
  variant,
  title,
  description,
  icon: Icon,
  children,
}: EntityListEmptyStateProps) {
  const LeadingIcon = variant === "search" ? MagnifyingGlassIcon : Icon;

  return (
    <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
      {LeadingIcon ? (
        <LeadingIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
      ) : null}
      <p className="mt-4 text-sm font-semibold text-foreground font-sans">{title}</p>
      <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm mx-auto">{description}</p>
      {children ? <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Accent create / primary recovery control for empty catalogues. */
export function EntityListEmptyPrimaryAction({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
      {...props}
    >
      {children}
    </button>
  );
}

/** Ghost clear-search / clear-filters control for empty search results. */
export function EntityListEmptySecondaryAction({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      {...props}
    >
      {children}
    </button>
  );
}
