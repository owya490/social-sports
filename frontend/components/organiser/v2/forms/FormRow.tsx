"use client";

import {
  FormHoverBody,
  FormHoverFlags,
} from "@/components/organiser/v2/forms/FormHoverBody";
import {
  EntityHoverCoverIcon,
  EntityHoverPreview,
} from "@/components/organiser/v2/shared/EntityHoverPreview";
import { Form } from "@/interfaces/FormTypes";
import { DocumentTextIcon, EyeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function formatUpdated(lastUpdated: Form["lastUpdated"]): string | null {
  if (!lastUpdated) return null;
  return lastUpdated.toDate().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Australia/Sydney",
  });
}

type FormRowProps = {
  form: Form;
};

export function FormRow({ form }: FormRowProps) {
  const sectionCount = form.sectionsOrder.length;
  const description = stripHtml(form.description || "");
  const updated = formatUpdated(form.lastUpdated);
  const title = form.title?.trim() || "Untitled form";

  return (
    <EntityHoverPreview
      cover={
        <EntityHoverCoverIcon>
          <DocumentTextIcon className="h-8 w-8" aria-hidden />
        </EntityHoverCoverIcon>
      }
      title={title}
      body={<FormHoverBody form={form} />}
      flags={<FormHoverFlags form={form} />}
    >
      <div className="flex flex-col gap-3 p-2.5 sm:p-3 sm:flex-row sm:items-center sm:gap-3 hover:bg-surface-hover transition-colors">
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
          <DocumentTextIcon className="h-5 w-5 text-foreground-secondary" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 py-0.5 px-1 sm:px-0">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">{title}</p>
            <span className="shrink-0 rounded-lg bg-surface px-2 py-0.5 text-xs font-medium text-foreground-secondary font-sans">
              {sectionCount} section{sectionCount === 1 ? "" : "s"}
            </span>
          </div>
          {description ? (
            <p className="mt-1 text-xs text-foreground-muted font-sans line-clamp-2">{description}</p>
          ) : null}
          <p className="mt-1 text-xs text-foreground-muted font-sans truncate">
            {updated ? `Updated ${updated}` : "Not updated yet"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-center">
          <Link
            href={`/organiser/forms/${form.formId}/editor`}
            className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={`Edit ${title}`}
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/organiser/forms/${form.formId}/preview`}
            className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={`Preview ${title}`}
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </EntityHoverPreview>
  );
}

export function FormRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 p-2.5 sm:p-3">
      <Skeleton height={48} width={48} className="!rounded-lg shrink-0" />
      <div className="min-w-0 flex-1 py-0.5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton height={14} width="55%" />
          <Skeleton height={14} width={64} />
        </div>
        <Skeleton height={12} width="75%" />
        <Skeleton height={12} width="35%" />
      </div>
    </div>
  );
}
