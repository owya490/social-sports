"use client";
import OrganiserFilterDialog, {
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
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { setDateToEndOfDay, setDateToStartOfDay } from "@/services/src/datetimeUtils";
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

  const { user } = useUser();
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

  const logger = new Logger("OrganiserDashboard");

  function applyFilters() {
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
      const startDateObj = setDateToStartOfDay(new Date(dateRange.startDate));
      const endDateObj = setDateToEndOfDay(new Date(dateRange.endDate));
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(startDateObj),
        Timestamp.fromDate(endDateObj)
      );
      filteredEventDataList = newEventDataList;
      setAppliedDateRange(dateRange);
    }

    // Filter by SORT BY is done in useEffect below
    setAppliedSortByCategoryValue(sortByCategoryValue);
    let newEventDataList = filterEventsBySortBy([...filteredEventDataList], sortByCategoryValue);
    filteredEventDataList = newEventDataList;
    setEventDataList([...filteredEventDataList]);
    closeModal();
  }

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await getOrganiserEvents(user.userId);
        setEventDataList(events);
        setAllEventsDataList(events);
        setLoading(false);
      } catch (error) {
        // Handle errors here
        logger.error(`Failed to get organiser events: ${error}`);
      }
    };
    fetchData();
  }, [user]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }

  return (
    <div className="px-4">
      <div className="flex flex-row justify-between items-center">
        <div className="text-3xl md:text-4xl lg:text-5xl my-6 md:ml-4 lg:ml-0">Event Dashboard</div>
        <div className="lg:hidden">
          <OrganiserFilterDialogMobile
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
      <div className="flex justify-center">
        <div className="hidden lg:block mr-4">
          <OrganiserFilterDialog
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4 justify-items-center lg:max-h-screen lg:overflow-y-auto lg:h-[80vh] w-full">
            {loadingEventDataList.map((event, eventIdx) => {
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
                    loading={true}
                  />
                </div>
              );
            })}
          </div>
        ) : eventDataList.length === 0 ? (
          <div className="flex justify-center">
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
        ) : (
          <div className="z-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-4 justify-items-center lg:max-h-screen lg:overflow-y-auto lg:h-[80vh]">
            {filterEventsBySortBy(eventDataList, appliedSortByCategoryValue).map((event, eventIdx) => {
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
        )}
      </div>
    </div>
  );
}
