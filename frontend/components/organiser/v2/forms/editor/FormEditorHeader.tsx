"use client";

import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EyeIcon } from "@heroicons/react/24/outline";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import Link from "next/link";

type FormEditorHeaderProps = {
  subtitle: string;
  previewHref: string | null;
  onSave: () => void;
  isFormModified: boolean;
  isSubmitting: boolean;
};

export function FormEditorHeader({
  subtitle,
  previewHref,
  onSave,
  isFormModified,
  isSubmitting,
}: FormEditorHeaderProps) {
  return (
    <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-4">
      <OrganiserBreadcrumbs />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Edit form
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {previewHref ? (
            <Link
              href={previewHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <EyeIcon className="h-4 w-4" aria-hidden />
              Preview
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={!isFormModified || isSubmitting}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast" />
            ) : (
              <FloppyDiskIcon className="h-4 w-4" aria-hidden />
            )}
            Save
          </button>
        </div>
      </div>
    </header>
  );
}
