"use client";

import CollectionBanner from "@/components/collections/CollectionBanner";
import EventCard from "@/components/events/EventCard";
import Loading from "@/components/loading/Loading";
import OrganiserCalendar from "@/components/users/profile/OrganiserCalendar";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  EventCollectionNotFoundError,
  getEventCollectionById,
} from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { getPublicUserById } from "@/services/src/users/usersService";
import { startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EventCollectionPageProps {
  params: {
    id: string;
  };
}
const logger = new Logger("EventCollectionPage");

export default function EventCollectionPage({ params }: EventCollectionPageProps) {
  const collectionId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<EventCollection>(EMPTY_EVENT_COLLECTION);
  const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

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
        const eventPromises = collectionData.eventIds.map((eventId: EventId) => getEventById(eventId));
        const eventsData = await Promise.all(eventPromises);

        // Filter out any events that might have been deleted and sort by start date
        const validEvents = eventsData.filter((event: EventData) => event.eventId);
        validEvents.sort((a: EventData, b: EventData) => a.startDate.toMillis() - b.startDate.toMillis());

        // Split events into upcoming and past
        const now = startOfDay(new Date());
        const upcoming = validEvents.filter((event: EventData) => event.startDate.toDate() >= now);
        const past = validEvents.filter((event: EventData) => event.startDate.toDate() < now);

        setUpcomingEvents(upcoming);
        setPastEvents(past);
        setLoading(false);
      } catch (error) {
        if (error instanceof EventCollectionNotFoundError) {
          router.push("/not-found");
          return;
        }
        logger.error(`Error fetching event collection: ${error}`);
        router.push(getErrorUrl(error));
      }
    };

    fetchCollectionData();
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div className="w-full flex justify-center pb-24">
      {/* Events Calendar Section */}
      <div className="flex justify-center mt-6 md:mt-8">
        <div className="screen-width-primary px-4 md:px-3">
          {/* Collection Banner */}
          <CollectionBanner
            name={collection.name}
            description={collection.description}
            organiser={organiser}
            eventCount={upcomingEvents.length + pastEvents.length}
            image={collection.image}
          />
          <div className="my-4">
            <h2 className="text-2xl md:text-3xl font-bold text-core-text">Events in this Collection</h2>
            <p className="text-gray-600 text-sm md:text-base mt-2">
              Browse and explore all events included in this collection
            </p>
          </div>

          {upcomingEvents.length + pastEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No events in this collection yet</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for upcoming events</p>
            </div>
          ) : (
            <>
              <OrganiserCalendar events={[...upcomingEvents, ...pastEvents]} />

              {/* Tabs for Upcoming and Past Events */}
              <div className="mt-12">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upcoming")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "upcoming"
                        ? "text-core-text border-b-2 border-black"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Upcoming Events ({upcomingEvents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("past")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "past"
                        ? "text-core-text border-b-2 border-black"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Past Events ({pastEvents.length})
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "upcoming" ? (
                  upcomingEvents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-lg">No upcoming events</p>
                      <p className="text-gray-500 text-sm mt-2">Check back later for new events</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {upcomingEvents.map((event) => (
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
                  )
                ) : pastEvents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-lg">No past events</p>
                    <p className="text-gray-500 text-sm mt-2">Past events will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {pastEvents.map((event) => (
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
