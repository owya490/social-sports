"use client";
import LoadingSkeletonOrganiserName from "@/components/loading/LoadingSkeletonOrganiserName";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
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
    <div className="pt-[3.5rem] pb-20 sm:pb-4 sm:pl-14 lg:max-h-screen">
      <OrganiserNavbar currPage="Dashboard" />
      <OrganiserAnnouncementBanner />
      <div className="pt-2 md:py-16 md:flex md:justify-center px-4 md:px-0">
        <div>
          <h1 className="text-5xl font-bold mt-2 sm:mt-0">Organiser Dashboard</h1>
          {loading ? (
            <LoadingSkeletonOrganiserName />
          ) : (
            <h1 className="pt-2 sm:pt-4 text-4xl font-semibold text-[#BABABA]">Welcome {user.firstName}</h1>
          )}
          <div className="lg:flex w-full mt-8 lg:max-h-[60vh]">
            <div className="grow lg:mr-8 md:flex flex-col md:w-[40rem]">
              <OrganiserChecklist />
              <div className="hidden md:grid grid-cols-2 gap-4 mt-8 grow min-h-[10vh] mb-10 md:mb-0">
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href="/event/create">
                    <div className="h-full flex justify-center items-center">
                      <p>Create an event</p>
                    </div>
                  </Link>
                </div>
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray  rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href={`/organiser/forms/create-form/form-editor`}>
                    <div className="h-full flex justify-center items-center">
                      <p>Create a form</p>
                    </div>
                  </Link>
                </div>
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href="/organiser/event/dashboard">
                    <div className="h-full flex justify-center items-center">
                      <p>View your events</p>
                    </div>
                  </Link>
                </div>
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href="/profile">
                    <div className="h-full flex justify-center items-center">
                      <p>Edit your profile</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="md:overflow-auto mt-6 lg:mt-0">
              <div className="bg-organiser-light-gray py-4 rounded-2xl lg:px-8">
                <h1 className="text-2xl font-bold text-center w-full">Upcoming Events</h1>
              </div>
              <div className="sm:grid sm:grid-cols-2 sm:gap-2 lg:block">
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
                      <div key={eventIdx} className="mt-4 md:mt-8 ">
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
                <div className="p-4 rounded-2xl mt-2 sm:mt-8">
                  <h1 className="text-2xl font-normal text-center">No Events 😔</h1>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
