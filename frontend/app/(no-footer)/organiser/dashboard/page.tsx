"use client";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserEventCard from "@/components/events/OrganiserEventCard";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { useUser } from "@/components/utility/UserContext";
import OrganiserCheckbox from "@/components/organiser/OrganiserCheckbox";

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([EmptyEventData]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = (await getOrganiserEvents(user.userId)).filter((event) => {
          return event.startDate.seconds - Timestamp.now().seconds > 0;
        });
        setEventDataList(events);
      } catch (error) {
        // Handle errors here
        console.error("getOrganiserEvents: " + error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  return (
    <div className="pt-16 pl-14 max-h-screen">
      <OrganiserNavbar currPage="Dashboard" />
      <div className="py-16 flex justify-center">
        <div>
          <h1 className="text-5xl font-bold">Organiser Dashboard</h1>
          <h1 className="pt-4 text-4xl font-semibold text-[#BABABA]">Welcome {user.firstName}</h1>
          <div className="flex w-full mt-8">
            <div className="grow mr-8 max-h-[60vh]">
              <div className="bg-organiser-light-gray p-8 rounded-2xl">
                <h1 className="text-2xl font-bold">Finish setting up</h1>
                <OrganiserCheckbox label="Add a picture" link="/profile" />
                <OrganiserCheckbox label="Add a description" link="/profile" />
                <OrganiserCheckbox label="Add a Stripe account" link="/" />
                <OrganiserCheckbox label="New registrations on your event!" link="/" />
              </div>
              <div className="flex mt-8">
                <div className="flex-1 text-center align-middle font-semibold text-2xl bg-organiser-light-gray px-8 py-24 mr-8 rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href="/event/create">
                    <p>Create an event template</p>
                  </Link>
                </div>
                <div className="flex-1 text-center align-middle font-semibold text-2xl bg-organiser-light-gray px-8 py-24 rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <Link href="/profile">
                    <p>Edit your profile</p>
                  </Link>
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-scroll rounded-2xl">
              <div className="bg-organiser-light-gray p-4 rounded-2xl">
                <h1 className="text-2xl font-bold text-center">Upcoming Events</h1>
              </div>
              <div>
                {eventDataList
                  .sort((event1, event2) => {
                    const seconds = Timestamp.now().seconds;
                    if (event1.startDate.seconds - seconds < event2.startDate.seconds - seconds) {
                      return 1;
                    }
                    if (event1.startDate.seconds - seconds > event2.startDate.seconds - seconds) {
                      return -1;
                    }
                    return 0;
                  })
                  .map((event, eventIdx) => {
                    return (
                      <div key={eventIdx} className="mt-6">
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
                {eventDataList.length == 0 && <div>No Upcoming Events</div>}
              </div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
}
