// "use client";
// import RecommendedEvents from "@/components/events/RecommendedEvents";
// import CreateEventBanner from "@/components/home/CreateEventBanner";
// import Hero from "@/components/home/Hero";
// import LoadingOverlay from "@/components/home/LoadingOverlay";
// import NewsletterSignup from "@/components/home/NewsletterSignup";
// import PopularEvents from "@/components/home/PopularEvents";
// import PopularLocations from "@/components/home/PopularLocations";
// import SearchSport from "@/components/home/SearchSport";
// import { sleep } from "@/utilities/sleepUtil";
// import { useEffect, useState } from "react";

// export default function Home() {
//   const [shouldAnimate, setShouldAnimate] = useState(false);
//   useEffect(() => {
//     async function init() {
//       document.getElementById("page")!.classList.add("hidden");
//       document.getElementById("footer")!.classList.add("hidden");
//       await sleep(2200);
//       document.getElementById("page")!.classList.remove("hidden");
//       document.getElementById("footer")!.classList.remove("hidden");
//     }

//     if (sessionStorage.getItem("animation") === null) {
//       setShouldAnimate(true);
//       init();
//     }
//   }, []);

//   return (
//     <div>
//       <LoadingOverlay shouldAnimate={shouldAnimate} />
//       <div id="page" className="">
//         <div className="mt-20 w-screen justify-center flex">
//           <div className="screen-width-dashboard">
//             <Hero />
//             <SearchSport />
//           </div>
//         </div>
//         <RecommendedEvents />
//         <div className="my-16 md:my-36 w-screen flex justify-center">
//           <div className="screen-width-dashboard">
//             <NewsletterSignup />
//           </div>
//         </div>
//         <PopularLocations />
//         <PopularEvents />
//         <CreateEventBanner />
//       </div>
//     </div>
//   );
// }

"use client";
import FilterBanner from "@/components/Filter/FilterBanner";
import EventCard from "@/components/events/EventCard";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { getAllEvents, getEventById, searchEventsByKeyword } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const loadingEventDataList: EventData[] = [
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ];
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
  const [triggerFilterApply, setTriggerFilterApply] = useState<boolean | undefined>(undefined);
  const [endLoading, setEndLoading] = useState<boolean | undefined>(false);
  const getQueryParams = () => {
    // if (typeof window === "undefined") {
    console.log(window);
    if (window === undefined) {
      console.log("aidan");
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
      await sleep(500);
      const { event, location } = getQueryParams();
      if (event === "UNDEFINED") {
        console.log("owen");
        return false;
      }

      if (typeof event === "string" && typeof location === "string") {
        if (event.trim() === "") {
          console.log("no event name");
          getAllEvents()
            .then((events) => {
              console.log(events);
              setEventDataList(events);
              setSearchDataList(events);
              setAllEventsDataList(events);
            })
            .finally(async () => {
              await sleep(500);
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
            })
            .catch(() => {
              router.push("/error");
            });
        }
      }
      if (location.trim() !== "") {
        setSrcLocation(location);
        if (triggerFilterApply === undefined) {
          setTriggerFilterApply(false);
        } else {
          setTriggerFilterApply(!triggerFilterApply);
        }
      } else {
        setLoading(false);
      }
    };

    // fetchEvents();
    setLoading(true);
    fetchEvents();
  }, [searchParams]);

  // useEffect listener for when filtering finishes
  useEffect(() => {
    if (endLoading !== undefined) {
      setLoading(false);
    }
  }, [endLoading]);

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
          endLoading={endLoading}
          setEndLoading={setEndLoading}
        />
      </div>
      <div className="absolute ml-auto mr-auto left-0 right-0 top-32 w-fit">
        <Alert open={showLoginSuccess} color="green">
          Successfully logged in!
        </Alert>
      </div>
      <div className="flex justify-center">
        <div className="pb-10 screen-width-dashboard">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-screen justify-items-center">
              {loadingEventDataList.map((event, eventIdx) => {
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
          ) : eventDataList.length === 0 ? (
            <div className="flex justify-center w-screen">
              <div>
                <Image
                  src={noSearchResultLineDrawing}
                  alt="noSearchResultLineDrawing"
                  width={500}
                  height={300}
                  className="opacity-60"
                />

                <div className="flex justify-center text-gray-600 font-medium text-lg sm:text-2xl text-center">
                  Sorry, we couldn&apos;t find any results
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
