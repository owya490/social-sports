"use client";

import OrganiserEventCard from "@/components/organiser/dashboard/OrganiserEventCard";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { getEventCollectionById } from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { ArrowLeftIcon, LinkIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const collectionId = params.id;
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([]);
  const [collection, setCollection] = useState<EventCollection>(EMPTY_EVENT_COLLECTION);
  const [copied, setCopied] = useState(false);

  const logger = new Logger("CollectionPage");

  const loadingEventDataList: EventData[] = [
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collection = await getEventCollectionById(collectionId);
        setCollection(collection);
        const events: EventData[] = [];
        for (const eventId of collection.eventIds) {
          const event = await getEventById(eventId);
          events.push(event);
        }

        setEventDataList(events);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get events for collection: ${error}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopyLink = () => {
    const collectionUrl = `${getUrlWithCurrentHostname(`/event-collection/${collectionId}`)}`;
    navigator.clipboard.writeText(collectionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pb-10 mt-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/organiser/event/collections"
            className="inline-flex items-center text-gray-600 hover:text-core-text mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>

          <div className="bg-white rounded-lg border border-gray-300 p-4 md:p-6 mb-6">
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-core-text">{collection.name}</h1>
                <div className="flex items-center gap-2">
                  {collection.isPrivate && (
                    <span className="flex items-center text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                      <LockClosedIcon className="w-3 h-3 mr-1" />
                      Private
                    </span>
                  )}
                  {collection.isDefault && (
                    <span className="text-xs px-3 py-1.5 bg-black text-white rounded-full whitespace-nowrap">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm md:text-base">{collection.description}</p>
            </div>

            {/* Collection Link */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection Link</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-600 font-mono overflow-x-auto whitespace-nowrap">
                  {`${getUrlWithCurrentHostname(`/event-collection/${collectionId}`)}`}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center space-x-2 px-4 py-1.5 bg-black text-white rounded-lg hover:bg-white hover:text-black border border-black transition-colors whitespace-nowrap"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Only people with this link can view this collection. Share it to let others see these events.
              </p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-core-text mb-4">
            Events ({loading ? "..." : eventDataList.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingEventDataList.map((event, eventIdx) => (
                <div className="w-full" key={eventIdx}>
                  <OrganiserEventCard
                    eventId={event.eventId}
                    image={event.image}
                    name={event.name}
                    organiser={event.organiser}
                    startTime={event.startDate}
                    location={event.location}
                    price={event.price}
                    vacancy={event.vacancy}
                    loading={true}
                  />
                </div>
              ))}
            </div>
          ) : eventDataList.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Image
                  src={noSearchResultLineDrawing}
                  alt="No events found"
                  width={400}
                  height={240}
                  className="opacity-60 mx-auto mb-6"
                />
                <div className="text-gray-600 font-medium text-lg sm:text-2xl">
                  No upcoming events in this collection
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Events will automatically appear here once you create upcoming events
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventDataList.map((event, eventIdx) => (
                <div className="w-full" key={eventIdx}>
                  <OrganiserEventCard
                    eventId={event.eventId}
                    image={event.image}
                    name={event.name}
                    organiser={event.organiser}
                    startTime={event.startDate}
                    location={event.location}
                    price={event.price}
                    vacancy={event.vacancy}
                    loading={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
