import { EventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";
import { SortByCategory } from "../../components/Filter/FilterDialog";
import { getDistanceBetweenTwoCoords } from "./maps/mapsService";

export const NO_SPORT_CHOSEN_STRING = "";

export function filterEventsBySortBy(eventDataList: EventData[], sortByCategory: SortByCategory): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  switch (sortByCategory) {
    case SortByCategory.HOT:
      /// TODO: implement measurement of how 'Hot' an event is.
      /// Will currently use 1/3 of accessCount, 1/3 of tickets sold, and 1/3 of % full an event is to sort.
      eventDataListDeepClone.sort((eventA, eventB) => {
        const accessCountDiff = eventB.accessCount - eventA.accessCount;
        const ticketsSoldDiff = eventB.capacity - eventB.vacancy - (eventA.capacity - eventA.vacancy);
        const eventAPercentageSold = (eventA.capacity - eventA.vacancy) / eventA.capacity;
        const eventBPercentageSold = (eventB.capacity - eventB.vacancy) / eventB.capacity;
        const eventPercentageSoldDiff = eventBPercentageSold - eventAPercentageSold;
        return accessCountDiff + ticketsSoldDiff + eventPercentageSoldDiff;
      });
      break;

    /// TODO: implement measurement of how an event is 'TOP_RATED'.
    /// Currently sorting by upcoming events with most views.
    case SortByCategory.TOP_RATED:
      eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.startDate > Timestamp.now());
      eventDataListDeepClone.sort((eventA, eventB) => eventB.accessCount - eventA.accessCount);
      break;

    case SortByCategory.PRICE_ASCENDING:
      eventDataListDeepClone.sort((eventA, eventB) => eventA.price - eventB.price);
      break;

    case SortByCategory.PRICE_DESCENDING:
      eventDataListDeepClone.sort((eventA, eventB) => eventB.price - eventA.price);
      break;

    case SortByCategory.DATE_ASCENDING:
      eventDataListDeepClone.sort((eventA, eventB) => eventA.startDate.toMillis() - eventB.startDate.toMillis());
      break;

    case SortByCategory.DATE_DESCENDING:
      eventDataListDeepClone.sort((eventA, eventB) => eventB.startDate.toMillis() - eventA.startDate.toMillis());
      break;

    default:
      break;
  }
  return eventDataListDeepClone;
}

export function filterEventsBySearch(eventDataList: EventData[], searchValue: string): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  if (searchValue !== "") {
    eventDataListDeepClone = eventDataListDeepClone.filter(
      (event) =>
        event.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        event.location.toLowerCase().includes(searchValue.toLowerCase())
    );
  }
  return eventDataListDeepClone;
}

export function filterEventsByStatus(eventDataList: EventData[], eventStatusValue: string): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  if (eventStatusValue === "past") {
    eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.isActive === false);
  } else if (eventStatusValue === "future") {
    eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.isActive === true);
  }
  return eventDataListDeepClone;
}

export function filterEventsByType(eventDataList: EventData[], eventTypeValue: string): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  if (eventTypeValue === "private") {
    eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.isPrivate === true);
  } else if (eventTypeValue === "public") {
    eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.isPrivate === false);
  }
  return eventDataListDeepClone;
}

export function filterEventsByPrice(
  eventDataList: EventData[],
  minPrice: number | null,
  maxPrice: number
): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  if (minPrice !== null) {
    eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.price >= minPrice * 100);
  }

  eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.price <= maxPrice * 100);
  return eventDataListDeepClone;
}

export function filterEventsByDate(eventDataList: EventData[], startDate: Timestamp, endDate: Timestamp): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  eventDataListDeepClone = eventDataListDeepClone.filter(
    // we only want to compare the start date of the event. (Do not change the latter half to endDate)
    (event) => event.startDate.toMillis() >= startDate.toMillis() && event.startDate.toMillis() <= endDate.toMillis()
  );
  return eventDataListDeepClone;
}

export function filterEventsByMaxProximity(
  eventDataList: EventData[],
  maxProximity: number,
  srcLat: number,
  srcLng: number
): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  eventDataListDeepClone = eventDataListDeepClone.filter((event) => {
    const lat1 = event.locationLatLng.lat;
    const lng1 = event.locationLatLng.lng;
    return getDistanceBetweenTwoCoords([lat1, lng1], [srcLat, srcLng]) < maxProximity;
  });
  return eventDataListDeepClone;
}

export function filterEventsBySport(eventDataList: EventData[], sportType: string): EventData[] {
  if (sportType === NO_SPORT_CHOSEN_STRING) {
    return eventDataList;
  }
  let eventDataListDeepClone = [...eventDataList];
  eventDataListDeepClone = eventDataListDeepClone.filter((event) => event.sport === sportType);
  return eventDataListDeepClone;
}
