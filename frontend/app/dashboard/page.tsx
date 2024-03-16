"use client";
import FilterBanner from "@/components/Filter/FilterBanner";
import EventCard from "@/components/events/EventCard";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getAllEvents, getEventById, searchEventsByKeyword } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

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
  const [searchDataList, setSearchDataList] = useState<EventData[]>([]);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [srcLocation, setSrcLocation] = useState<string>("");
  const [triggerFilterApply, setTriggerFilterApply] = useState(false);
  const getQueryParams = () => {
    if (typeof window === "undefined") {
      // Return some default or empty values when not in a browser environment
      return { event: "", location: "" };
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      event: searchParams.get("event") || "",
      location: searchParams.get("location") || "",
    };
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const { event, location } = getQueryParams();
      setSrcLocation(location);
      if (typeof event === "string" && typeof location === "string") {
        if (event.trim() === "") {
          getAllEvents()
            .then((events) => {
              setEventDataList(events);
              setSearchDataList(events);
              setAllEventsDataList(events);
            })
            .finally(async () => {
              await sleep(500);
              setLoading(false);
            });
        } else {
          searchEventsByKeyword(event, location)
            .then(async (events) => {
              let tempEventDataList: EventData[] = [];
              for (const singleEvent of events) {
                const eventData = await getEventById(singleEvent.eventId);
                tempEventDataList.push(eventData);
              }
              return tempEventDataList;
            })
            .then((tempEventDataList: EventData[]) => {
              setEventDataList(tempEventDataList);
              setSearchDataList(tempEventDataList);
            })
            .finally(async () => {
              await sleep(500);
              setLoading(false);
            });
        }
      }
      if (location.trim() !== "") {
        setTriggerFilterApply(true);
      }
    };
    fetchEvents();
  }, [searchParams]);

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

  return (
    <div>
      <div className="flex justify-center">
        <FilterBanner
          eventDataList={searchDataList}
          allEventsDataList={allEventsDataList}
          setEventDataList={setEventDataList}
          srcLocation={srcLocation}
          setSrcLocation={setSrcLocation}
          triggerFilterApply={triggerFilterApply}
        />
      </div>
      <div className="absolute ml-auto mr-auto left-0 right-0 top-32 w-fit">
        <Alert open={showLoginSuccess} color="green">
          Successfully logged in!
        </Alert>
      </div>
      <div className="flex justify-center">
        <div className="pb-10 screen-width-dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-screen justify-items-center">
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
                  <div className="my-4 w-full" key={eventIdx}>
                    <EventCard
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
  );
}
