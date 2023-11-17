import {
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

export async function filterEventsByDateRange(
  startDate: Timestamp,
  endDate?: Timestamp
): Promise<EventData[]> {
  try {
    const eventsRef = collection(db, "Events");

    // TODO: need to make the where clause list modular to work amongst multiple filters.
    const whereClauseList = [where("startdate", ">=", startDate)];
    if (endDate) {
      whereClauseList.push(where("enddate", "<=", endDate));
    }

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
