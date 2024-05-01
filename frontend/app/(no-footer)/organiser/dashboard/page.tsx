"use client";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserEventCard from "@/components/events/OrganiserEventCard";
import { Timestamp } from "firebase/firestore";
import { UserData } from "@/interfaces/UserTypes";
import Link from "next/link";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { useEffect, useState } from "react";
import { getAllEvents, getOrganiserEvents } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";
import { useUser } from "@/components/utility/UserContext";

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await getOrganiserEvents(user.userId);
        setEventDataList(events);
      } catch (error) {
        // Handle errors here
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    console.log(eventDataList);
  }, [user]);

  return (
    <div className="pt-16 pl-14 h-full">
      <OrganiserNavbar currPage="Dashboard" />
      <div className="py-20 pl-32 pr-44 xl:pl-52 md:pr-64">
        <h1 className="text-5xl font-bold">Organiser Dashboard</h1>
        <h1 className="pt-4 text-4xl font-semibold text-[#BABABA]">Welcome Edwin</h1>
        <div className="flex w-full mt-8">
          <div className="grow mr-8">
            <div className="bg-organiser-light-gray p-8 rounded-2xl">
              <h1 className="text-2xl font-bold">Finish setting up</h1>
              <ul className="list-disc ml-6 mt-4 space-y-2 text-lg">
                <li className="hover:underline hover:cursor-pointer">Add a description</li>
                <li className="hover:underline hover:cursor-pointer">Add a picture</li>
                <li className="hover:underline hover:cursor-pointer">Add a Stripe account</li>
                <li className="hover:underline hover:cursor-pointer">New registrations on your event!</li>
                <li className="hover:underline hover:cursor-pointer">More...</li>
              </ul>
            </div>
            <div className="flex mt-8">
              <div className="flex-1 text-center align-middle font-semibold text-2xl bg-organiser-light-gray px-8 py-24 mr-8 rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                <Link href="/event/create">
                  <p className="">Create an event template</p>
                </Link>
              </div>
              <div className="flex-1 text-center align-middle font-semibold text-2xl bg-organiser-light-gray px-8 py-24 rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                <Link href="/profile">
                  <p className="">Edit your profile</p>
                </Link>
              </div>
            </div>
          </div>
          <div className="">
            <div className="bg-organiser-light-gray p-4 rounded-2xl mb-6">
              <h1 className="text-2xl font-bold text-center">Upcoming Events</h1>
            </div>
            <div className="">
              {eventDataList
                .sort((event1, event2) => {
                  // TODO: Fix sort, need the soonest event first
                  // if (event1.accessCount > event2.accessCount) {
                  //   return 1;
                  // }
                  // if (event2.accessCount < event2.accessCount) {
                  //   return -1;
                  // }
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
          </div>
        </div>
      </div>
    </div>
  );
}
