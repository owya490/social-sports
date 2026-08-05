"use client";

import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import { CollectionRow, CollectionRowSkeleton } from "./CollectionRow";

type CollectionsListProps = {
  collections: EventCollection[];
  loading: boolean;
  isCreating: boolean;
  onCreate: () => void;
};

export function CollectionsList({ collections, loading, isCreating, onCreate }: CollectionsListProps) {
  return (
    <section aria-label="Event collections" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10">
      {loading ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, index) => (
              <CollectionRowSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
          <RectangleStackIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
          <p className="mt-4 text-sm font-semibold text-foreground font-sans">No collections yet</p>
          <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm mx-auto">
            Group related sessions so you can share one link for a season or program.
          </p>
          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
          >
            {isCreating ? "Creating…" : "Create collection"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {collections.map((collection) =>
              collection.eventCollectionId ? (
                <CollectionRow key={collection.eventCollectionId} collection={collection} />
              ) : null,
            )}
          </div>
        </div>
      )}
    </section>
  );
}
