"use client";
import EventCard from "@/components/EventCard";
import FilterBanner from "@/components/Filter/FilterBanner";
import Loading from "@/components/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/eventsService";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@material-tailwind/react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const [eventDataList, setEventDataList] = useState<EventData[]>([]);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    getAllEvents()
      .then((events) => {
        setEventDataList(events);
        setAllEventsDataList(events);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const login = searchParams?.get("login");
    if (login === "success") {
      setShowLoginSuccess(true);

      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    let timer: number | undefined;

    if (showLoginSuccess) {
      timer = window.setTimeout(() => {
        setShowLoginSuccess(false);
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showLoginSuccess]);

  return loading ? (
    <Loading />
  ) : (
    <div>
      <div className="flex justify-center">
        <FilterBanner
          eventDataList={eventDataList}
          allEventsDataList={allEventsDataList}
          setEventDataList={setEventDataList}
        />
      </div>
      <div className="absolute ml-auto mr-auto left-0 right-0 top-32 w-fit">
        <Alert open={showLoginSuccess} color="green">
          Successfully logged in!
        </Alert>
      </div>
      <div className="flex justify-center">
        <div className="pb-10 screen-width-dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {eventDataList
              .sort((event1, event2) => {
                if (event1.accessCount > event2.accessCount) {
                  return 1;
                }
                if (event2.accessCount < event2.accessCount) {
                  return -1;
                }
                return 0;
              })
              .map((event, eventIdx) => {
                return (
                  <div className="my-4" key={eventIdx}>
                    <EventCard
                      eventId={event.eventId}
                      image={event.image}
                      name={event.name}
                      organiser={event.organiser}
                      startTime={event.startDate}
                      location={event.location}
                      price={event.price}
                      vacancy={event.vacancy}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
