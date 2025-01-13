// hooks/useFilteredEvents.ts
import { EventData } from "@/interfaces/EventTypes";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
  filterEventsBySortBy,
  filterEventsBySport,
} from "@/services/src/filterService";
import { SYDNEY_LAT, SYDNEY_LNG, getLocationCoordinates } from "@/services/src/locationUtils";
import { Timestamp } from "firebase/firestore";
import { SortByCategory } from "@/components/Filter/FilterDialog";
import { useQuery } from "@tanstack/react-query";
import { getAllEvents } from "@/services/src/events/eventsService";

interface UseFilteredEventsProps {
  srcLocation: string;
  triggerFilterApply: boolean | undefined;
  dateRange: { startDate: string | null; endDate: string | null };
  maxPriceSliderValue: number;
  maxProximitySliderValue: number;
  selectedSport: string;
  sortByCategoryValue: SortByCategory;
  event: string;
  location: string;
}

export const useFilteredEvents = ({
  srcLocation,
  triggerFilterApply,
  dateRange,
  maxPriceSliderValue,
  maxProximitySliderValue,
  selectedSport,
  sortByCategoryValue,
  event,
  location,
}: UseFilteredEventsProps) => {
  const fetchEvents = async (): Promise<EventData[]> => {
    // Fetch events from the service
    const response = await getAllEvents(); // Replace with your API call
    return response;
  };

  const {
    data: allEventsData,
    isLoading,
    error,
  } = useQuery<EventData[]>(
    [
      srcLocation,
      triggerFilterApply,
      dateRange,
      maxPriceSliderValue,
      maxProximitySliderValue,
      selectedSport,
      sortByCategoryValue,
      event,
      location,
    ],
    fetchEvents
  );

  const filterEvents = async (events: EventData[]) => {
    let filteredEventDataList = [...events];

    // Filter by price
    if (maxPriceSliderValue !== 100) {
      filteredEventDataList = filterEventsByPrice(filteredEventDataList, null, maxPriceSliderValue);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filteredEventDataList = filterEventsByDate(
        filteredEventDataList,
        Timestamp.fromDate(new Date(dateRange.startDate + "T00:00:00")),
        Timestamp.fromDate(new Date(dateRange.endDate + "T23:59:59"))
      );
    }

    // Filter by proximity
    if (srcLocation !== "" && maxProximitySliderValue !== 100) {
      let srcLat = SYDNEY_LAT;
      let srcLng = SYDNEY_LNG;
      try {
        const { lat, lng } = await getLocationCoordinates(srcLocation);
        srcLat = lat;
        srcLng = lng;
      } catch (error) {
        console.log(error);
      }

      filteredEventDataList = filterEventsByMaxProximity(
        filteredEventDataList,
        maxProximitySliderValue,
        srcLat,
        srcLng
      );
    }

    // Filter by sport
    filteredEventDataList = filterEventsBySport(filteredEventDataList, selectedSport);

    // Filter by sorting
    filteredEventDataList = filterEventsBySortBy(filteredEventDataList, sortByCategoryValue);

    return filteredEventDataList;
  };

  const filteredEvents = triggerFilterApply && allEventsData ? filterEvents(allEventsData) : allEventsData;

  return {
    isLoading,
    error,
    filteredEvents,
  };
};
