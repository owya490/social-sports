"use client";

import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

/**
 * Quiet Luma-style header — title + meta + Collection page. Cover lives in Details.
 */

type CollectionHubHeaderProps = {
  loading: boolean;
  collectionId: EventCollectionId;
  name: string;
  itemCount: number;
  isPrivate: boolean;
};

export function CollectionHubHeader({
  loading,
  collectionId,
  name,
  itemCount,
  isPrivate,
}: CollectionHubHeaderProps) {
  const itemsLabel =
    itemCount === 0 ? "No items yet" : `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  const meta = loading ? "" : `${itemsLabel} · ${isPrivate ? "Private" : "Public"}`;

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 max-w-6xl mx-auto">
      <div className="mb-3">
        <Link
          href="/organiser/v2/event/event-collection"
          className="text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          ← Collections
        </Link>
      </div>

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
            {loading ? <Skeleton width={160} height={14} /> : <p className="truncate">{meta}</p>}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Link
            href={`/event-collection/${collectionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Collection page
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
