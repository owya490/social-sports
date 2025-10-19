"use client";

import CollectionBanner from "@/components/collections/CollectionBanner";
import EventCard from "@/components/events/EventCard";
import Loading from "@/components/loading/Loading";
import OrganiserCalendar from "@/components/users/profile/OrganiserCalendar";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { EventData } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getEventCollectionById } from "@/services/src/eventCollections/collectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { getPublicUserById } from "@/services/src/users/usersService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EventCollectionPageProps {
  params: {
    id: string;
  };
}

export default function EventCollectionPage({ params }: EventCollectionPageProps) {
  const collectionId = params.id;
  const router = useRouter();
  const logger = new Logger("EventCollectionPage");

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<EventCollection>(EMPTY_EVENT_COLLECTION);
  const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        // Fetch the collection
        const collectionData = await getEventCollectionById(collectionId);
        setCollection(collectionData);

        // Fetch the organiser
        const organiserData = await getPublicUserById(collectionData.organiserId);
        setOrganiser(organiserData);

        // Fetch all events in the collection
        const eventPromises = collectionData.eventIds.map((eventId) => getEventById(eventId));
        const eventsData = await Promise.all(eventPromises);

        // Filter out any events that might have been deleted and sort by start date
        const validEvents = eventsData.filter((event) => event.eventId);
        validEvents.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());

        setEvents(validEvents);
        setLoading(false);
      } catch (error) {
        logger.error(`Error fetching event collection: ${error}`);
        router.push(getErrorUrl(error));
      }
    };

    fetchCollectionData();
  }, [collectionId, router, logger]);

  return loading ? (
    <Loading />
  ) : (
    <div className="w-full flex justify-center pb-24">
      <div className="w-full">
        {/* Collection Banner */}
        <CollectionBanner
          name={collection.name}
          description={collection.description}
          organiser={organiser}
          eventCount={events.length}
        />

        {/* Events Calendar Section */}
        <div className="flex justify-center mt-6 md:mt-8">
          <div className="screen-width-primary px-4 md:px-3">
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-core-text">Events in this Collection</h2>
              <p className="text-gray-600 text-sm md:text-base mt-2">
                Browse and explore all events included in this collection
              </p>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-lg">No events in this collection yet</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for upcoming events</p>
              </div>
            ) : (
              <>
                <OrganiserCalendar events={events} />

                {/* All Events Grid */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl md:text-3xl font-bold text-core-text mb-2">All Events</h2>
                  <p className="text-gray-600 text-sm md:text-base mb-6">
                    Browse all {events.length} {events.length === 1 ? "event" : "events"} in this collection
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {events.map((event) => (
                      <EventCard
                        key={event.eventId}
                        eventId={event.eventId}
                        image={event.image}
                        thumbnail={event.thumbnail}
                        name={event.name}
                        organiser={event.organiser}
                        startTime={event.startDate}
                        location={event.location}
                        price={event.price}
                        vacancy={event.vacancy}
                        loading={false}
                        isClickable={true}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
