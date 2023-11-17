import {
  QueryFieldFilterConstraint,
  Timestamp,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { EventData } from "@/interfaces/EventTypes";

const NUM_DOCS_QUERY_LIMIT = 15;

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

  return await filterEventsByWhereClauses(whereClauseList);
}

/**
 * Retrieves the events from the firebase database filtered by
 * a startDate and an optional endDate.
 *
 * @param startDate: Timestamp
 * @param endDate: Optional<Timestamp>
 * @returns EventData[]
 */
async function filterEventsByWhereClauses(
  whereClauseList: QueryFieldFilterConstraint[]
): Promise<EventData[]> {
  try {
    const eventsRef = collection(db, "Events");

    const filterEventsQuery = query(
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
