"use client";

import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { FormMiniaturePreview } from "@/components/organiser/v2/forms/FormMiniaturePreview";
import { Form } from "@/interfaces/FormTypes";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";

/** Collapsed footer strip — title + updated only; grows upward on hover. */
const FOOTER_COLLAPSED_PX = 52;
/** Portrait well — taller than 4:3 so more of the miniature reads. */
const PREVIEW_ASPECT = "aspect-[4/5]";
/** Miniature paper width before CSS scale. */
const PREVIEW_WIDTH_PX = 420;
const PREVIEW_SCALE = 0.4;

function formatUpdated(lastUpdated: Form["lastUpdated"]): string | null {
  if (!lastUpdated) return null;
  return lastUpdated.toDate().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Australia/Sydney",
  });
}

function hasDescription(description: Form["description"]): boolean {
  return description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length > 0;
}

type FormGalleryCardProps = {
  form: Form;
};

export function FormGalleryCard({ form }: FormGalleryCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const [locked, setLocked] = useState(false);
  const title = form.title?.trim() || "Untitled form";
  const updated = formatUpdated(form.lastUpdated);
  const showDescription = hasDescription(form.description);
  const editorHref = `/organiser/v2/forms/${form.formId}/editor`;
  const previewHref = `/organiser/v2/forms/${form.formId}/preview`;
  const expanded = hovered || locked;
  const previewLayoutWidth = PREVIEW_WIDTH_PX * PREVIEW_SCALE;

  useEffect(() => {
    if (!locked) return;

    const onPointerDown = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setLocked(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [locked]);

  return (
    <article
      ref={cardRef}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_2px_rgba(10,10,10,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:border-foreground-muted/35 hover:shadow-[0_12px_28px_rgba(10,10,10,0.12)] focus-within:-translate-y-1 focus-within:border-foreground-muted/35 focus-within:shadow-[0_12px_28px_rgba(10,10,10,0.12)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative ${PREVIEW_ASPECT} overflow-hidden bg-surface`}>
        <button
          type="button"
          onClick={() => {
            if (window.matchMedia("(hover: none)").matches) {
              setLocked((value) => !value);
              return;
            }
            router.push(editorHref);
          }}
          className="absolute inset-0 overflow-hidden pt-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          aria-label={expanded ? `Collapse ${title}` : `Edit ${title}`}
          aria-expanded={expanded}
        >
          <div className="mx-auto pointer-events-none select-none" style={{ width: previewLayoutWidth }}>
            <div
              className="origin-top-left"
              style={{
                width: PREVIEW_WIDTH_PX,
                transform: `scale(${PREVIEW_SCALE})`,
              }}
            >
              <FormMiniaturePreview form={form} />
            </div>
          </div>
        </button>

        {/* Bottom sheet: compact strip at rest, grows upward on hover/lock */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden border-t border-border bg-background transition-[height] duration-300 ease-out motion-reduce:transition-none"
          style={{
            height: expanded ? "100%" : FOOTER_COLLAPSED_PX,
            borderTopColor: expanded ? "transparent" : undefined,
          }}
        >
          <div
            className="flex shrink-0 flex-col justify-center px-3"
            style={{ height: FOOTER_COLLAPSED_PX }}
          >
            <p className="truncate text-sm font-semibold text-foreground font-sans leading-snug">{title}</p>
            <p className="text-xs leading-tight text-foreground-muted font-sans truncate">
              {updated ? `Updated ${updated}` : "Not updated yet"}
              {!form.formActive ? " · Inactive" : ""}
            </p>
          </div>

          <div
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 pb-3 transition-opacity duration-300 ease-out ${
              expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="min-h-0 flex-1 overflow-hidden text-xs text-foreground-secondary font-sans [&_.ProseMirror]:text-xs [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p]:my-1">
              {showDescription ? (
                <RichTextEditorContent description={form.description} />
              ) : (
                <p className="text-foreground-muted">No description</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={editorHref}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-foreground font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={(event) => event.stopPropagation()}
              >
                Edit
              </Link>
              <Link
                href={previewHref}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-foreground font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={(event) => event.stopPropagation()}
              >
                Preview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FormGalleryCreateCard() {
  return (
    <Link
      href="/organiser/v2/forms/create-form/editor"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_2px_rgba(10,10,10,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:border-foreground-muted/35 hover:shadow-[0_12px_28px_rgba(10,10,10,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <div className={`relative ${PREVIEW_ASPECT} overflow-hidden bg-surface`}>
        <div className="flex h-full items-center justify-center text-foreground-secondary transition-colors group-hover:text-foreground">
          <PlusIcon className="h-10 w-10" aria-hidden />
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground font-sans">Blank form</p>
          <p className="mt-0.5 text-xs text-foreground-muted font-sans">Start from scratch</p>
        </div>
      </div>
    </Link>
  );
}

export function FormGalleryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className={`relative ${PREVIEW_ASPECT} bg-surface p-4`}>
        <Skeleton height={20} width="70%" className="mb-3" />
        <Skeleton height={56} className="mb-2" />
        <Skeleton height={56} className="mb-2" />
        <Skeleton height={40} />
        <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-3 py-2.5 space-y-1.5">
          <Skeleton height={14} width="55%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
    </div>
  );
}
