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
  SortByCategory,
} from "@/components/filter/OrganiserFilterDialog";
import OrganiserEventCard from "@/components/organiser/dashboard/OrganiserEventCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import {
  filterEventsByDate,
  filterEventsByPrice,
  filterEventsBySearch,
  filterEventsBySortBy,
  filterEventsByStatus,
  filterEventsByType,
} from "@/services/src/filterService";
import { Timestamp } from "firebase/firestore";
import { useEffect, useLayoutEffect, useState } from "react";

export default function OrganiserDashboard() {
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

    // Filter by SEARCH
    if (searchValue !== DEFAULT_SEARCH) {
      let newEventDataList = filterEventsBySearch([...filteredEventDataList], searchValue);
      filteredEventDataList = newEventDataList;
    }
    // Filter by STATUS
    if (eventStatusValue !== DEFAULT_EVENT_STATUS) {
      let newEventDataList = filterEventsByStatus([...filteredEventDataList], eventStatusValue);
      filteredEventDataList = newEventDataList;
    }

    // Filter by TYPE
    if (eventTypeValue !== DEFAULT_EVENT_TYPE) {
      let newEventDataList = filterEventsByType([...filteredEventDataList], eventTypeValue);
      filteredEventDataList = newEventDataList;
    }

    // Filter by PRICE
    let minPrice = minPriceValue !== DEFAULT_MIN_PRICE ? minPriceValue : 0;
    let maxPrice = maxPriceValue !== DEFAULT_MAX_PRICE ? maxPriceValue : 9999;

    if (minPriceValue !== DEFAULT_MIN_PRICE || maxPriceValue !== DEFAULT_MAX_PRICE) {
      let newEventDataList = filterEventsByPrice([...filteredEventDataList], minPrice, maxPrice);
      filteredEventDataList = newEventDataList;
    }

    // Filter by DATERANGE
    if (dateRange.startDate && dateRange.endDate) {
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(new Date(dateRange.startDate + DAY_START_TIME_STRING)),
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      filteredEventDataList = newEventDataList;
    }

    // Filter by SORT BY
    let newEventDataList = filterEventsBySortBy([...filteredEventDataList], sortByCategoryValue);
    filteredEventDataList = newEventDataList;
    setAppliedSortByCategoryValue(sortByCategoryValue);
    setEventDataList([...filteredEventDataList]);
  }

  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const [eventDataList, setEventDataList] = useState<EventData[]>([
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await getOrganiserEvents(user.userId);
        setEventDataList(events);
        setAllEventsDataList(events);
      } catch (error) {
        // Handle errors here
      }
    };
    fetchData();
    setLoading(false);
  }, [user]);

  return (
    <div className="w-screen mt-16 mb-10 ml-7 h-screen max-h-screen overflow-hidden">
      <OrganiserNavbar currPage="EventDrilldown" />
      <div className="flex justify-center">
        <div className="flex flex-col items-start">
          <div className="text-6xl my-6">Event Dashboard</div>
          <div className="flex flex-row h-screen">
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
            <div className="z-5 grid grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-x-2 2xl:gap-x-5 gap-y-2 2xl:gap-y-5 justify-items-center max-h-screen overflow-y-auto px-4 min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px] h-fit">
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
                    <div className="w-full" key={eventIdx}>
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
