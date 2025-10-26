"use client";

import CollectionCard from "@/components/organiser/event-collection/EventCollectionCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserCollections } from "@/services/src/eventCollections/eventCollectionsService";
import { useEffect, useState } from "react";

export default function EventCollectionsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<EventCollection[]>([]);

  const logger = new Logger("EventCollectionsPage");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collectionsData = await getOrganiserCollections(user.userId);
        setCollections(collectionsData);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get organiser events for event collections: ${error}`);
        setLoading(false);
      }
    };
    if (user.userId !== "") {
      fetchData();
    }
  }, [user]);

  return (
    <div className="px-4 max-w-6xl mx-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="text-3xl md:text-4xl lg:text-5xl my-6 md:ml-4 lg:ml-0">Event Collections</div>
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
