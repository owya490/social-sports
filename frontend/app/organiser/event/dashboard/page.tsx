"use client";
import OrganiserFilterDialog, {
  DAY_END_TIME_STRING,
  DAY_START_TIME_STRING,
  DEFAULT_END_DATE,
  DEFAULT_EVENT_STATUS,
  DEFAULT_EVENT_TYPE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MIN_PRICE,
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY_CATEGORY,
  DEFAULT_START_DATE,
  DEFAULT_UID,
  SortByCategory,
} from "@/components/Filter/OrganiserFilterDialog";
import OrganiserEventCard from "@/components/events/OrganiserEventCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getAllEvents, getEventById, searchEventsByKeyword } from "@/services/src/events/eventsService";
import {
  filterEventsByDate,
  filterEventsByPrice,
  filterEventsBySearch,
  filterEventsBySortBy,
  filterEventsByStatus,
  filterEventsByType,
  filterEventsByUID,
} from "@/services/src/filterService";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { useUser } from "@/components/utility/UserContext";

export default function OrganiserDashboard() {
  const { user } = useUser();
  const [loggedInUserId, setLoggedInUserId] = useState<string>(DEFAULT_UID);
  const [sortByCategoryValue, setSortByCategoryValue] = useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [appliedSortByCategoryValue, setAppliedSortByCategoryValue] =
    useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [searchValue, setSearchValue] = useState<string>(DEFAULT_SEARCH);
  const [eventStatusValue, setEventStatusValue] = useState<string>(DEFAULT_EVENT_STATUS);
  const [eventTypeValue, setEventTypeValue] = useState<string>(DEFAULT_EVENT_TYPE);
  const [minPriceValue, setMinPriceValue] = useState<number | null>(DEFAULT_MIN_PRICE);
  const [appliedMinPriceValue, setAppliedMinPriceValue] = useState<number | null>(DEFAULT_MIN_PRICE);
  const [maxPriceValue, setMaxPriceValue] = useState<number | null>(DEFAULT_MAX_PRICE);
  const [appliedMaxPriceValue, setAppliedMaxPriceValue] = useState<number | null>(DEFAULT_MAX_PRICE);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });

  async function applyFilters() {
    let filteredEventDataList = [...allEventsDataList];

    // Filter by UID
    if (loggedInUserId) {
      let newEventDataList = filterEventsByUID([...filteredEventDataList], loggedInUserId);
      filteredEventDataList = newEventDataList;
      console.log("no wakas", loggedInUserId);
    }

    // Filter by SEARCH
    if (searchValue !== "") {
      let newEventDataList = filterEventsBySearch([...filteredEventDataList], searchValue);
      filteredEventDataList = newEventDataList;
    }
    setSearchValue(searchValue);

    // Filter by STATUS
    if (eventStatusValue !== "") {
      let newEventDataList = filterEventsByStatus([...filteredEventDataList], eventStatusValue);
      filteredEventDataList = newEventDataList;
    }
    setEventStatusValue(eventStatusValue);

    // Filter by TYPE
    if (eventTypeValue !== "") {
      let newEventDataList = filterEventsByType([...filteredEventDataList], eventTypeValue);
      filteredEventDataList = newEventDataList;
    }
    setEventTypeValue(eventTypeValue);

    // Filter by PRICE
    let minPrice = minPriceValue !== null ? minPriceValue : 0;
    let maxPrice = maxPriceValue !== null ? maxPriceValue : 9999;

    if (minPriceValue !== null || maxPriceValue !== null) {
      let newEventDataList = filterEventsByPrice([...filteredEventDataList], minPrice, maxPrice);
      filteredEventDataList = newEventDataList;
    }
    setAppliedMinPriceValue(minPriceValue);
    setAppliedMaxPriceValue(maxPriceValue);

    // Filter by DATERANGE
    if (dateRange.startDate && dateRange.endDate) {
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(new Date(dateRange.startDate + DAY_START_TIME_STRING)),
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      filteredEventDataList = newEventDataList;
    }
    setAppliedDateRange(dateRange);

    // Filter by SORT BY
    let newEventDataList = filterEventsBySortBy([...filteredEventDataList], sortByCategoryValue);
    filteredEventDataList = newEventDataList;
    setAppliedSortByCategoryValue(sortByCategoryValue);
    setEventDataList([...filteredEventDataList]);
  }

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
    const userId = user.userId;
    console.log("user set", user);
    setLoggedInUserId(userId);
  }, [user]);

  useEffect(() => {
    const login = searchParams?.get("login");
    if (login === "success") {
      setShowLoginSuccess(true);

      router.replace("/organiser/event/dashboard");
    }
  }, [router, searchParams]);

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

  useEffect(() => {
    applyFilters();
  }, []);

  return (
    <div className="w-screen mt-16 mb-10 ml-7 h-screen max-h-screen overflow-hidden">
      <OrganiserNavbar currPage={""} />
      <div className="text-6xl ml-7 p-10">Event Dashboard</div>
      <div className="flex justify-center h-screen">
        <OrganiserFilterDialog
          eventDataList={eventDataList}
          allEventsDataList={allEventsDataList}
          setEventDataList={setEventDataList}
          sortByCategoryValue={sortByCategoryValue}
          setSortByCategoryValue={setSortByCategoryValue}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          eventStatusValue={eventStatusValue}
          setEventStatusValue={setEventStatusValue}
          eventTypeValue={eventTypeValue}
          setEventTypeValue={setEventTypeValue}
          minPriceValue={minPriceValue}
          setMinPriceValue={setMinPriceValue}
          maxPriceValue={maxPriceValue}
          setMaxPriceValue={setMaxPriceValue}
          dateRange={dateRange}
          setDateRange={setDateRange}
          applyFilters={applyFilters}
        />
        <div className="z-5 grid grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-x-2 2xl:gap-x-5 justify-items-center max-h-screen overflow-y-auto mb-60 px-4  min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px]">
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
                <div className="mb-[30px] w-full" key={eventIdx}>
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
  );
}
