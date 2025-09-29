"use client";
import FilterBanner from "@/components/Filter/FilterBanner";
import EventCard from "@/components/events/EventCard";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { getAllEvents, getEventById, searchEventsByKeyword } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
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
  const [_srcLocation, setSrcLocation] = useState<string>("");
  const [triggerFilterApply, setTriggerFilterApply] = useState<boolean | undefined>(undefined);
  const [endLoading, setEndLoading] = useState<boolean | undefined>(undefined);
  const getQueryParams = () => {
    // if (typeof window === "undefined") {
    if (window === undefined) {
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
          const events = await getAllEvents();
          console.log(events);
          setEventDataList(events);
          setSearchDataList(events);
          setAllEventsDataList(events);
        } else {
          try {
            const events = await searchEventsByKeyword(event, location);
            let tempEventDataList: EventData[] = [];
            for (const singleEvent of events) {
              const eventData = await getEventById(singleEvent.eventId);
              tempEventDataList.push(eventData);
            }
            setEventDataList(tempEventDataList);
            setSearchDataList(tempEventDataList);
          } catch (error) {
            console.error(error);
            router.push("/error");
          }
        }
      }
      setSrcLocation(location);
      if (location.trim() !== "") {
        if (triggerFilterApply === undefined) {
          setTriggerFilterApply(false);
        } else {
          setTriggerFilterApply(!triggerFilterApply);
        }
      } else {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchEvents();
  }, [searchParams]);

  // useEffect listener for when filtering finishes
  useEffect(() => {
    const finishLoading = async () => {
      if (endLoading !== undefined) {
        // Something wrong with endLoading in the filter stuff
        await sleep(500);
        setLoading(false);
      }
    };
    finishLoading();
  }, [endLoading]);

  useEffect(() => {
    const login = searchParams?.get("login");
    if (login === "success") {
      setShowLoginSuccess(true);

      router.replace("/");
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
    <>
      <Head>
        {/* SEO Meta Tags for Dashboard/Homepage */}
        <title>SPORTSHUB | Find Sports Events Near You</title>
        <meta
          name="description"
          content="Discover and book local sports events on SPORTSHUB. Find basketball, volleyball, soccer, tennis and more recreational sports activities in your area."
        />
        <meta
          name="keywords"
          content="sportshub, local sports events, book sports, recreational sports, australia sports, find sports near me, sports activities"
        />

        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content="SPORTSHUB Dashboard - Find Sports Events Near You" />
        <meta
          property="og:description"
          content="Discover and book local sports events. Basketball, volleyball, soccer, tennis and more!"
        />
        <meta property="og:url" content="https://sportshub.net.au/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sportshub.net.au/images/logo.png" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SPORTSHUB Dashboard - Find Sports Events Near You" />
        <meta
          name="twitter:description"
          content="Discover and book local sports events. Basketball, volleyball, soccer, tennis and more!"
        />
        <meta name="twitter:image" content="https://sportshub.net.au/images/logo.png" />

        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="SPORTSHUB" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://sportshub.net.au/" />

        {/* Local Business Schema for Australian Sports Platform */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "SPORTSHUB Dashboard",
            description: "Find and book local sports events in Australia",
            url: "https://sportshub.net.au/",
            mainEntity: {
              "@type": "SearchResultsPage",
              name: "Sports Events Search",
              description: "Search and discover local sports activities and events",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://sportshub.net.au/",
                },
              ],
            },
          })}
        </script>
      </Head>

      <div>
        <div className="flex justify-center">
          <FilterBanner
            eventDataList={searchDataList}
            allEventsDataList={allEventsDataList}
            setEventDataList={setEventDataList}
            // srcLocation={srcLocation} // DISABLED LOCATION SEARCH FOR NOW
            srcLocation={""}
            setSrcLocation={setSrcLocation}
            triggerFilterApply={triggerFilterApply}
            endLoading={endLoading}
            setEndLoading={setEndLoading}
          />
        </div>
        <div className="absolute ml-auto mr-auto left-0 right-0 top-32 w-fit z-50">
          <Alert open={showLoginSuccess} color="green">
            Successfully logged in!
          </Alert>
        </div>
        <div className="flex flex-col justify-center items-center w-full min-h-[60vh] mt-4 px-3 sm:px-20 lg:px-3 pb-10">
          {loading === false && eventDataList.length === 0 && (
            <div className="flex flex-col justify-center items-center w-full">
              <div>
                <Image
                  src={noSearchResultLineDrawing}
                  alt="noSearchResultLineDrawing"
                  width={500}
                  height={300}
                  className="opacity-60"
                />
                <div className="text-gray-600 font-medium text-lg sm:text-2xl text-center">
                  Sorry, we couldn&apos;t find any results
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-6 gap-4 lg:gap-8 w-full lg:px-10 xl:px-16 2xl:px-24 3xl:px-40">
            {eventDataList
              .sort((a, b) => b.accessCount - a.accessCount)
              .map((event, eventIdx) => {
                return (
                  <EventCard
                    eventId={event.eventId}
                    image={event.image}
                    thumbnail={event.thumbnail}
                    name={event.name}
                    organiser={event.organiser}
                    startTime={event.startDate}
                    location={event.location}
                    price={event.price}
                    vacancy={event.vacancy}
                    loading={loading}
                    key={eventIdx}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
