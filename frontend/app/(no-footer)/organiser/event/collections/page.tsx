"use client";

import CollectionCard from "@/components/organiser/collections/CollectionCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserCollections } from "@/services/src/eventCollections/eventCollectionsService";
import { useEffect, useState } from "react";

export default function CollectionsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<EventCollection[]>([]);

  const logger = new Logger("CollectionsPage");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCollections(await getOrganiserCollections(user.userId));
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get organiser events for collections: ${error}`);
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
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
                <CollectionCard collection={EMPTY_EVENT_COLLECTION} loading={true} />
              </>
            ) : (
              collections.map((collection) => (
                <CollectionCard key={collection.eventCollectionId} collection={collection} loading={false} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
