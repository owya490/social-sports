"use client";

import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import CollectionCard from "@/components/organiser/event-collection/EventCollectionCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { DEFAULT_EVENT_IMAGE_URL } from "@/interfaces/ImageTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  createEventCollection,
  getOrganiserCollections,
} from "@/services/src/eventCollections/eventCollectionsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventCollectionsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<EventCollection[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const logger = new Logger("EventCollectionsPage");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collectionsData = await getOrganiserCollections(user.userId);
        setCollections(collectionsData);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get organiser events for event collections: ${error}`);
        router.push(getErrorUrl(error));
      }
    };
    if (user.userId !== "") {
      fetchData();
    }
  }, [user, logger, router]);

  const handleCreateCollection = async () => {
    setIsCreating(true);
    try {
      const collectionId = await createEventCollection(
        user.userId,
        "Untitled Collection",
        "Add a description for your collection",
        true, // Default to private
        DEFAULT_EVENT_IMAGE_URL
      );
      router.push(`/organiser/event/event-collection/${collectionId}`);
    } catch (error) {
      logger.error(`Failed to create collection: ${error}`);
      router.push(getErrorUrl(error));
      setIsCreating(false);
    }
  };

  return (
    <div className="px-4 max-w-6xl mx-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="text-3xl md:text-4xl lg:text-5xl my-6 md:ml-4 lg:ml-0">Event Collections</div>
        <InvertedHighlightButton
          onClick={handleCreateCollection}
          text={isCreating ? "Creating..." : "Create Collection"}
          disabled={isCreating}
        />
      </div>

      <div className="flex justify-center">
        <div className="w-full">
          <p className="text-gray-600 mb-8 md:ml-4 lg:ml-0">
            Organize your events into collections to easily share and manage groups of events.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {loading ? (
              <>
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} organiser={EmptyPublicUserData} loading={true} />
              </>
            ) : (
              collections.map((collection) => (
                <CollectionCard
                  key={collection.eventCollectionId}
                  collection={collection}
                  organiser={user}
                  loading={false}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
