"use client";
import LoadingSkeletonOrganiserName from "@/components/loading/LoadingSkeletonOrganiserName";
import { OrganiserAnnouncementBanner } from "@/components/organiser/dashboard/OrganiserAnnouncementBanner";
import OrganiserChecklist from "@/components/organiser/dashboard/OrganiserChecklist";
import OrganiserEventCard from "@/components/organiser/dashboard/OrganiserEventCard";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([EmptyEventData, EmptyEventData]);
  const router = useRouter();

  const organiserDashboardLogger = new Logger("organiserDashboardLogger");

  useEffect(() => {
    const fetchEvents = async () => {
      if (user.userId === "") {
        return;
      }
      try {
        const events = (await getOrganiserEvents(user.userId)).filter((event) => {
          return event.startDate.seconds - Timestamp.now().seconds > 0;
        });

        setEventDataList(events);
        setLoading(false);
      } catch (error) {
        organiserDashboardLogger.error("getOrganiserEvents() Error: " + error);
        router.push("/error");
      }
    };
    fetchEvents();
  }, [user]);

  return (
    <div className="lg:max-h-screen bg-background">
      <OrganiserAnnouncementBanner />
      <div className="py-6 md:py-12 md:flex md:justify-center px-4">
        <div className="max-w-6xl w-full">
          <h1 className="type-display mt-2 sm:mt-0">Organiser Dashboard</h1>
          {loading ? (
            <LoadingSkeletonOrganiserName />
          ) : (
            <p className="mt-2 text-xl font-semibold text-foreground-secondary font-sans">
              Welcome {user.firstName}
            </p>
          )}
          <div className="lg:flex mt-8 w-full lg:max-h-[60vh] gap-8">
            <div className="grow md:flex flex-col lg:w-[40rem] md:min-h-[60vh]">
              <OrganiserChecklist />
              <div className="hidden md:grid grid-cols-2 gap-4 mt-8 grow min-h-[10vh] mb-10 md:mb-0">
                <Link
                  href="/event/create"
                  className="flex-1 min-h-full type-body bg-surface rounded-xl hover:bg-accent hover:text-accent-contrast transition-colors"
                >
                  <div className="h-full flex justify-center items-center p-6">
                    <p>Create an event</p>
                  </div>
                </Link>
                <Link
                  href={`/organiser/forms/create-form/editor`}
                  className="flex-1 min-h-full type-body bg-surface rounded-xl hover:bg-accent hover:text-accent-contrast transition-colors"
                >
                  <div className="h-full flex justify-center items-center p-6">
                    <p>Create a form</p>
                  </div>
                </Link>
                <Link
                  href="/organiser/event/dashboard"
                  className="flex-1 min-h-full type-body bg-surface rounded-xl hover:bg-accent hover:text-accent-contrast transition-colors"
                >
                  <div className="h-full flex justify-center items-center p-6">
                    <p>View your events</p>
                  </div>
                </Link>
                <Link
                  href="/organiser/wrapped/2025"
                  className="flex-1 min-h-full type-body bg-surface rounded-xl hover:bg-accent hover:text-accent-contrast transition-colors"
                >
                  <div className="h-full flex justify-center items-center p-6">
                    <p>View your 2025 Wrapped</p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="md:overflow-auto mt-8 lg:mt-0 lg:max-w-sm w-full">
              <div className="bg-surface py-4 px-6 rounded-xl">
                <h2 className="type-section text-center w-full">Upcoming Events</h2>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-4 lg:block lg:space-y-4 mt-4">
                {eventDataList
                  .sort((event1, event2) => {
                    const seconds = Timestamp.now().seconds;
                    if (event1.startDate.seconds - seconds < event2.startDate.seconds - seconds) {
                      return -1;
                    }
                    if (event1.startDate.seconds - seconds > event2.startDate.seconds - seconds) {
                      return 1;
                    }
                    return 0;
                  })
                  .map((event, eventIdx) => {
                    return (
                      <div key={eventIdx}>
                        <OrganiserEventCard
                          eventId={event.eventId}
                          image={event.image}
                          name={event.name}
                          organiser={event.organiser}
                          startTime={event.startDate}
                          location={event.location}
                          price={event.price}
                          vacancy={event.vacancy}
                          loading={loading}
                        />
                      </div>
                    );
                  })}
              </div>
              {eventDataList.length === 0 && (
                <div className="p-4 rounded-xl mt-4">
                  <p className="type-section font-normal text-center text-foreground-secondary">No Events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
