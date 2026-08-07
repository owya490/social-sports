"use client";

import type { ReactNode } from "react";

type ImagePickerLoadingVariant = "full" | "image-only";

type ImagePickerLoadingProps = {
  /** `full` = thumbnail + event image sections (events / recurring). `image-only` = collection cover. */
  variant?: ImagePickerLoadingVariant;
};

const SECTION_META: Record<
  "thumbnail" | "image",
  { title: string; description: string; aspect: string; tiles: number }
> = {
  thumbnail: {
    title: "Event Thumbnails",
    description: "Loading your square crops…",
    aspect: "aspect-square",
    tiles: 5,
  },
  image: {
    title: "Event Images",
    description: "Loading your 16:9 covers…",
    aspect: "aspect-video",
    tiles: 5,
  },
};

function ShimmerTile({ aspect, delayMs }: { aspect: string; delayMs: number }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface-muted ${aspect}`}
    >
      <div
        className="image-picker-shimmer absolute inset-0 motion-reduce:animate-none"
        style={{ animationDelay: `${delayMs}ms` }}
        aria-hidden
      />
    </div>
  );
}

function SectionSkeleton({
  kind,
  gridCols,
}: {
  kind: "thumbnail" | "image";
  gridCols: string;
}) {
  const meta = SECTION_META[kind];
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="relative h-5 w-36 overflow-hidden rounded-md bg-surface-muted">
          <div className="image-picker-shimmer absolute inset-0 motion-reduce:animate-none" aria-hidden />
        </div>
        <div className="relative h-3.5 w-56 max-w-full overflow-hidden rounded-md bg-surface-muted/80">
          <div
            className="image-picker-shimmer absolute inset-0 motion-reduce:animate-none"
            style={{ animationDelay: "80ms" }}
            aria-hidden
          />
        </div>
        <p className="sr-only">
          {meta.title}. {meta.description}
        </p>
      </div>
      <div className={`grid ${gridCols} gap-3`}>
        {Array.from({ length: meta.tiles }, (_, index) => (
          <ShimmerTile key={index} aspect={meta.aspect} delayMs={index * 70} />
        ))}
      </div>
    </div>
  );
}

/**
 * Operate-mode loading scaffold for Change photo / image edit panels.
 * Mirrors the real picker layout so the wait reads as progress, not a blank sheet.
 */
export function ImagePickerLoading({ variant = "full" }: ImagePickerLoadingProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-8 pb-4">
      <p className="text-xs text-foreground-muted font-sans">Loading your photos…</p>
      {variant === "full" ? (
        <>
          <SectionSkeleton kind="thumbnail" gridCols="grid-cols-2 md:grid-cols-3" />
          <SectionSkeleton kind="image" gridCols="grid-cols-2 md:grid-cols-3" />
        </>
      ) : (
        <SectionSkeleton kind="image" gridCols="grid-cols-2" />
      )}
    </div>
  );
}

type ImagePickerRevealProps = {
  loading: boolean;
  variant?: ImagePickerLoadingVariant;
  children: ReactNode;
};

/**
 * Shows {@link ImagePickerLoading} while fetching, then fades the real picker in.
 */
export function ImagePickerReveal({ loading, variant = "full", children }: ImagePickerRevealProps) {
  if (loading) {
    return <ImagePickerLoading variant={variant} />;
  }

  return <div className="image-picker-reveal motion-reduce:animate-none">{children}</div>;
}
