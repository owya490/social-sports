"use client";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserEventCard from "@/components/events/OrganiserEventCard";
import { OrganiserEventCardProps } from "@/components/events/OrganiserEventCard";
import { Timestamp } from "firebase/firestore";
import { UserData } from "@/interfaces/UserTypes";
import Link from "next/link";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { useEffect, useState } from "react";
import { getAllEvents } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";

// const sampleOrganiser: UserData = {
//   userId: "",
//   firstName: "Sydney Thunder",
//   profilePicture:
//     "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
//   surname: "Volleyball",
//   dob: "",
// };

// let sampleEvent: OrganiserEventCardProps = {
//   eventId: "5TMe1IEOYHlITKiR0Dw1",
//   image:
//     "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2F2izGPMqX9OZiXts0tCOcZ3CRPLm1%2F1707660757165_IMG_2602.PNG?alt=media&token=42cd1374-b265-4151-b8c5-2dc9c5deba3a",
//   name: "First Ever Event!",
//   organiser: sampleOrganiser,
//   startTime: Timestamp.now(),
//   location: "Sports Halls",
//   price: 10,
//   vacancy: 8,
// };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const [eventDataList, setEventDataList] = useState<EventData[]>([
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ]);

  useEffect(() => {
    const fetchEvents = async () => {
      getAllEvents()
        .then((events) => {
          setEventDataList(events);
          setAllEventsDataList(events);
        })
        .finally(async () => {
          await sleep(500);
          setLoading(false);
        });
    };
    fetchEvents();
  }, []);

  return (
    <div className="pt-16 pl-14 h-full">
      <OrganiserNavbar currPage="Dashboard" />
      <div className="py-20 pl-52 pr-64">
        <h1 className="text-5xl font-bold">Organiser Dashboard</h1>
        <h1 className="pt-4 text-4xl font-semibold text-[#BABABA]">Welcome Edwin</h1>
        <div className="flex w-full mt-8">
          <div className="grow mr-8">
            <div className="bg-organiser-light-gray p-8 rounded-2xl">
              <h1 className="text-2xl font-semibold">Finish setting up</h1>
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
          <div className="bg-organiser-light-gray p-8 rounded-2xl w-1/3">
            <h1 className="text-2xl font-bold text-center">Upcoming Events</h1>
            {/* <OrganiserEventCard
              eventId={sampleEvent.eventId}
              image={sampleEvent.image}
              name={sampleEvent.name}
              organiser={sampleEvent.organiser}
              startTime={sampleEvent.startTime}
              location={sampleEvent.location}
              price={sampleEvent.price}
              vacancy={sampleEvent.vacancy}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
