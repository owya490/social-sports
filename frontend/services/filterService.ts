import { EventData } from "@/interfaces/EventTypes";
import {
  QueryFieldFilterConstraint,
  Timestamp,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import geofire from "geofire-common";
import { db } from "./firebase";
import { getDistanceBetweenTwoCoords } from "./locationUtils";
import { SortByCategory } from "../components/Filter/FilterDialog";

interface ProximityInfo {
  center: geofire.Geopoint;
  radiusInM: number;
}

const NUM_DOCS_QUERY_LIMIT = 15;
export const NO_SPORT_CHOSEN_STRING = "";

export function filterEventsBySortBy(
  eventDataList: EventData[],
  sortByCategory: SortByCategory
): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  switch (sortByCategory) {
    case SortByCategory.HOT:
      /// TODO: implement measurement of how 'Hot' an event is.
      /// Currently, it sorts events alphabetically by name.
      eventDataListDeepClone.sort((eventA, eventB) =>
        eventA.name.localeCompare(eventB.name)
      );
      break;

    case SortByCategory.PRICE_ASCENDING:
      eventDataListDeepClone.sort(
        (eventA, eventB) => eventA.price - eventB.price
      );
      break;

    case SortByCategory.PRICE_DESCENDING:
      eventDataListDeepClone.sort(
        (eventA, eventB) => eventB.price - eventA.price
      );
      break;

    case SortByCategory.DATE_ASCENDING:
      eventDataListDeepClone.sort(
        (eventA, eventB) =>
          eventA.startDate.toMillis() - eventB.startDate.toMillis()
      );
      break;

    case SortByCategory.DATE_DESCENDING:
      eventDataListDeepClone.sort(
        (eventA, eventB) =>
          eventB.startDate.toMillis() - eventA.startDate.toMillis()
      );
      break;

    default:
      break;
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
    eventDataListDeepClone = eventDataListDeepClone.filter(
      (event) => event.price >= minPrice
    );
  }

  eventDataListDeepClone = eventDataListDeepClone.filter(
    (event) => event.price <= maxPrice
  );
  return eventDataListDeepClone;
}

export function filterEventsByDate(
  eventDataList: EventData[],
  startDate: Timestamp,
  endDate: Timestamp
): EventData[] {
  let eventDataListDeepClone = [...eventDataList];
  eventDataListDeepClone = eventDataListDeepClone.filter(
    (event) =>
      event.startDate.toMillis() >= startDate.toMillis() &&
      event.startDate.toMillis() <= endDate.toMillis()
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
    return (
      getDistanceBetweenTwoCoords([lat1, lng1], [srcLat, srcLng]) < maxProximity
    );
  });
  return eventDataListDeepClone;
}

export function filterEventsBySport(
  eventDataList: EventData[],
  sportType: string
): EventData[] {
  if (sportType === NO_SPORT_CHOSEN_STRING) {
    return eventDataList;
  }
  let eventDataListDeepClone = [...eventDataList];
  eventDataListDeepClone = eventDataListDeepClone.filter(
    (event) => event.sport === sportType
  );
  return eventDataListDeepClone;
}

/**
 * @deprecated This method does not work and should not be used.
 * Returns a filtered list of up to 15 events from the firebase storage.
 *
 * @param filterFieldsMap: Map where the key is the event field name as seen in firebase.
 * See full documentation here: https://owenyang.atlassian.net/wiki/spaces/SD/pages/20414465/Firebase+Event+Filtering
 * @returns EventData[]
 */
export async function filterEvents(filterFieldsMap: { [key: string]: any }) {
  const whereClauseList: QueryFieldFilterConstraint[] = [];
  Object.keys(filterFieldsMap).forEach(async (key: string) => {
    switch (key) {
      case "startDate":
        let startDate: Timestamp = filterFieldsMap["startDate"].startDate;
        let endDate: Timestamp | null = null;
        if ("endDate" in filterFieldsMap["startDate"]) {
          endDate = filterFieldsMap["startDate"].endDate;
        }
        await createWhereClauseEventDate(whereClauseList, startDate, endDate);

      case "price":
        if ("price" in filterFieldsMap) {
          let minPrice: number | null = null;
          if ("minPrice" in filterFieldsMap["price"]) {
            minPrice = filterFieldsMap["price"].minPrice;
          }

          let maxPrice: number | null = null;
          if ("maxPrice" in filterFieldsMap["price"]) {
            maxPrice = filterFieldsMap["price"].maxPrice;
          }

          await createWhereClauseEventPrice(
            whereClauseList,
            minPrice,
            maxPrice
          );
        }

      // TODO: add more filters here
    }
  });

  return await filterEventsByWhereClausesAndProximity(whereClauseList);
}

/**
 * @deprecated This method does not work and should not be used.
 * Retrieves the events from the firebase database filtered by
 * a startDate and an optional endDate.
 *
 * @param startDate: Timestamp
 * @param endDate: Optional<Timestamp>
 * @returns EventData[]
 */
async function filterEventsByWhereClausesAndProximity(
  whereClauseList: QueryFieldFilterConstraint[],
  proximityInfo?: ProximityInfo
): Promise<EventData[]> {
  try {
    const eventsRef = collection(db, "Events");

    let filterEventsQuery = query(
      eventsRef,
      ...whereClauseList,
      limit(NUM_DOCS_QUERY_LIMIT)
    );

    const filteredEventsSnapshot = await getDocs(filterEventsQuery);
    const filteredEventsData: EventData[] = [];

    filteredEventsSnapshot.forEach((doc) => {
      const filteredEventData = doc.data() as EventData;
      filteredEventData.eventId = doc.id;
      filteredEventsData.push(filteredEventData);
    });

    return filteredEventsData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * @deprecated This method does not work and should not be used.
 * Helper function for the backend filter service.
 * Creates and appends a query where clause based on startDate onto the currWhereClauseList
 * Call this function to add the respective filter.
 *
 * @param currWhereClauseList
 * @param startDate
 * @param endDate
 */
async function createWhereClauseEventDate(
  currWhereClauseList: QueryFieldFilterConstraint[],
  startDate: Timestamp,
  endDate: Timestamp | null
) {
  currWhereClauseList.push(where("startDate", ">=", startDate));
  if (endDate) {
    currWhereClauseList.push(where("endDate", "<=", endDate));
  }
}

/**
 * @deprecated This method does not work and should not be used.
 * Helper function for the backend filter service.
 * Creates an appends a query where clause based on price onto the currWhereClauseList
 * Call this function to add the respective filter.
 *
 * @param currWhereClauseList
 * @param minPrice
 * @param maxPrice
 */
async function createWhereClauseEventPrice(
  currWhereClauseList: QueryFieldFilterConstraint[],
  minPrice: number | null,
  maxPrice: number | null
) {
  if (!minPrice && !maxPrice) {
    throw new Error(
      "No minPrice and no maxPrice provided. Please provide at least one!"
    );
  }

  if (minPrice) {
    currWhereClauseList.push(where("price", ">=", minPrice));
  }
  if (maxPrice) {
    currWhereClauseList.push(where("price", "<=", maxPrice));
  }
}

// TODO: add more createWhereClause functions here
