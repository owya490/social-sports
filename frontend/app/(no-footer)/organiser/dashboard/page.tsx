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
import LoadingSkeletonOrganiserName from "@/components/loading/LoadingSkeletonOrganiserName";

const initialChecklist = [
  { id: 0, checked: false, label: "Add a picture", link: "/profile" },
  { id: 1, checked: false, label: "Add a description", link: "/profile" },
  { id: 2, checked: false, label: "Add a Stripe Account", link: "/event/create" },
  { id: 3, checked: false, label: "Create your first event!", link: "/event/create" },
];
export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([EmptyEventData, EmptyEventData]);
  const [checklist, setChecklist] = useState(initialChecklist);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user.userId == "") {
        return;
      }
      try {
        const events = (await getOrganiserEvents(user.userId)).filter((event) => {
          return event.startDate.seconds - Timestamp.now().seconds > 0;
        });
        let checklist = localStorage.getItem("checklist");
        if (checklist != null) {
          checklist = JSON.parse(checklist);
          setChecklist(checklist);
        }

        setEventDataList(events);
        setLoading(false);
      } catch (error) {
        console.error("getOrganiserEvents() Error: " + error);
      }
    };
    fetchEvents();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("checklist", JSON.stringify(checklist));
  }, [checklist]);

  const handleCheck = (idx: number) => {
    setChecklist(
      checklist.map((check) => {
        if (check.id == idx) {
          return { ...check, checked: !check.checked };
        } else {
          return check;
        }
      })
    );
  };

  return (
    <div className="pt-16 pl-14 max-h-screen">
      <OrganiserNavbar currPage="Dashboard" />
      <div className="py-16 flex justify-center">
        <div>
          <h1 className="text-5xl font-bold">Organiser Dashboard</h1>
          {loading ? (
            <LoadingSkeletonOrganiserName />
          ) : (
            <h1 className="pt-4 text-4xl font-semibold text-[#BABABA]">Welcome {user.firstName}</h1>
          )}
          <div className="flex w-full mt-8 max-h-[60vh]">
            <div className="grow mr-8 flex flex-col">
              <div className="bg-organiser-light-gray p-8 rounded-2xl">
                <h1 className="text-2xl font-bold">Finish setting up</h1>
                {checklist.map((checkbox) => (
                  <OrganiserCheckbox
                    key={checkbox.id}
                    label={checkbox.label}
                    link={checkbox.link}
                    checked={checkbox.checked}
                    onChange={() => handleCheck(checkbox.id)}
                  />
                ))}
              </div>
              <div className="flex mt-8 grow">
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray mr-8 rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <div className="h-full flex text-center items-center">
                    <Link href="/event/create">
                      <p>Create an event template</p>
                    </Link>
                  </div>
                </div>
                <div className="flex-1 min-h-full font-semibold text-2xl bg-organiser-light-gray rounded-2xl hover:bg-highlight-yellow hover:text-white hover:cursor-pointer">
                  <div className="h-full flex justify-center items-center">
                    <Link href="/profile">
                      <p>Edit your profile</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-auto">
              <div className="bg-organiser-light-gray py-4 rounded-2xl">
                <h1 className="text-2xl font-bold text-center w-full sm:w-[300px] xl:w-[290px] 2xl:w-[320px]">
                  Upcoming Events
                </h1>
              </div>
              <div>
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
                      <div key={eventIdx} className="mt-8">
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
                {eventDataList.length == 0 && (
                  <div className="bg-organiser-light-gray p-4 rounded-2xl mt-8 min-h-full h-full">
                    <h1 className="text-2xl font-normal text-center">No Events 😔</h1>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
}
