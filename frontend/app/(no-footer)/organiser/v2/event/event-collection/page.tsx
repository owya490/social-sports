"use client";

import { CollectionsHeader } from "@/components/organiser/v2/collections/CollectionsHeader";
import { CollectionsList } from "@/components/organiser/v2/collections/CollectionsList";
import { useUser } from "@/components/utility/UserContext";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { DEFAULT_EVENT_IMAGE_URL } from "@/interfaces/ImageTypes";
import { Logger } from "@/observability/logger";
import {
  createEventCollection,
  getOrganiserCollections,
} from "@/services/src/eventCollections/eventCollectionsService";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserEventCollectionsV2");

export default function OrganiserEventCollectionsV2Page() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collections, setCollections] = useState<EventCollection[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchCollections = async () => {
    if (user.userId === "") {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const data = await getOrganiserCollections(user.userId);
      setCollections(data);
    } catch (fetchError) {
      logger.error(`Failed to get organiser collections: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user.userId]);

  const handleCreateCollection = async () => {
    setIsCreating(true);
    try {
      const collectionId = await createEventCollection(
        user.userId,
        "Untitled Collection",
        "Add a description for your collection",
        true,
        DEFAULT_EVENT_IMAGE_URL,
      );
      router.push(`/organiser/event/event-collection/${collectionId}`);
    } catch (createError) {
      logger.error(`Failed to create collection: ${createError}`);
      setError(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* THESIS: A scannable collection catalogue—privacy and item count clear, open any group in one tap.
          OWN-WORLD: Honest Clubhouse tokens—shared row language with Your events.
          STORY: Create or open a collection; edit details on the legacy drilldown.
          FIRST VIEWPORT: Title + create CTA, unified row panel below.
          FORM: Established v2 operate extension; list-only port (drilldowns stay legacy).
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <CollectionsHeader
          collectionCount={collections.length}
          loading={loading}
          isCreating={isCreating}
          onCreate={() => {
            void handleCreateCollection();
          }}
        />

        {error ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
            <div className="rounded-xl border border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Could not load collections</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  void fetchCollections();
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <CollectionsList
            collections={collections}
            loading={loading}
            isCreating={isCreating}
            onCreate={() => {
              void handleCreateCollection();
            }}
          />
        )}
      </div>
    </>
  );
}
