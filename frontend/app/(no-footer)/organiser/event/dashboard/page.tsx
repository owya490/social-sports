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
} from "@/components/Filter/OrganiserFilterDialog";
import OrganiserFilterDialogMobile from "@/components/Filter/OrganiserFilterDialogMobile";
import OrganiserEventCard from "@/components/organiser/dashboard/OrganiserEventCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
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
import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";

export default function OrganiserDashboard() {
  const [sortByCategoryValue, setSortByCategoryValue] = useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [appliedSortByCategoryValue, setAppliedSortByCategoryValue] =
    useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [searchValue, setSearchValue] = useState<string>(DEFAULT_SEARCH);
  const [appliedSearchValue, setAppliedSearchValue] = useState<string>(DEFAULT_SEARCH);
  const [eventStatusValue, setEventStatusValue] = useState<string>(DEFAULT_EVENT_STATUS);
  const [eventTypeValue, setEventTypeValue] = useState<string>(DEFAULT_EVENT_TYPE);
  const [appliedEventTypeValue, setAppliedEventTypeValue] = useState<string>(DEFAULT_EVENT_TYPE);
  const [minPriceValue, setMinPriceValue] = useState<number | null>(DEFAULT_MIN_PRICE);
  const [maxPriceValue, setMaxPriceValue] = useState<number | null>(DEFAULT_MAX_PRICE);
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
      setAppliedSearchValue(searchValue);
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
      setAppliedEventTypeValue(eventTypeValue);
      filteredEventDataList = newEventDataList;
    }

    // Filter by PRICE
    let minPrice = minPriceValue !== DEFAULT_MIN_PRICE ? minPriceValue : 0;
    let maxPrice = maxPriceValue !== DEFAULT_MAX_PRICE ? maxPriceValue : 999999;

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
      setAppliedDateRange(dateRange);
    }

    // Filter by SORT BY
    let newEventDataList = filterEventsBySortBy([...filteredEventDataList], sortByCategoryValue);
    filteredEventDataList = newEventDataList;
    setAppliedSortByCategoryValue(sortByCategoryValue);
    setEventDataList([...filteredEventDataList]);
    closeModal();
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
  }, [user]);

  useEffect(() => {
    if (allEventsDataList.length !== 0) {
      setLoading(false);
    }
  }, [allEventsDataList]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }

  return (
    <div className="pt-14 pb-16 px-4 sm:pl-20 sm:pb-4 lg:pl-32 lg:pr-12">
      <OrganiserNavbar currPage={"EventDashboard"} />
      <div className="flex flex-row mt-6 justify-between">
        <div className="text-3xl md:text-4xl lg:text-5xl font-semibold">Event Dashboard</div>
        <div className="lg:hidden">
          <OrganiserFilterDialogMobile
            eventDataList={eventDataList}
            allEventsDataList={allEventsDataList}
            setEventDataList={setEventDataList}
            sortByCategoryValue={sortByCategoryValue}
            setSortByCategoryValue={setSortByCategoryValue}
            appliedSortByCategoryValue={appliedSortByCategoryValue}
            setAppliedSortByCategoryValue={setAppliedSortByCategoryValue}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            appliedSearchValue={appliedSearchValue}
            setAppliedSearchValue={setAppliedSearchValue}
            eventTypeValue={eventTypeValue}
            setEventTypeValue={setEventTypeValue}
            appliedEventTypeValue={appliedEventTypeValue}
            setAppliedEventTypeValue={setAppliedEventTypeValue}
            dateRange={dateRange}
            setDateRange={setDateRange}
            appliedDateRange={appliedDateRange}
            setAppliedDateRange={setAppliedDateRange}
            applyFilters={applyFilters}
            isFilterModalOpen={isFilterModalOpen}
            setIsFilterModalOpen={setIsFilterModalOpen}
            closeModal={closeModal}
          />
        </div>
      </div>
      <div className="flex flex-row w-full mt-4 md:h-[80vh]">
        <div className="hidden lg:block mr-2">
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
        </div>

        {loading === false && eventDataList.length === 0 && (
          <div className="flex justify-center z-10">
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
        {eventDataList.length !== 0 && (
          <div className="w-full z-5 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6 md:h-full md:overflow-y-auto">
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
        )}
      </div>
    </div>
  );
}
