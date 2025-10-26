import { ScrapedEventData } from "@/interfaces/ScrapedEventTypes";
import { Logger } from "@/observability/logger";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export const scrapedEventServiceLogger = new Logger("scrapedEventServiceLogger");

const SCRAPED_EVENTS_COLLECTION = "scraped_events";

/**
 * Get all scraped events
 */
export async function getScrapedEvents(): Promise<ScrapedEventData[]> {
  scrapedEventServiceLogger.info("getScrapedEvents");
  try {
    const scrapedEventsRef = collection(db, SCRAPED_EVENTS_COLLECTION);
    const q = query(scrapedEventsRef, orderBy("scrapedAt", "desc"));
    const snapshot = await getDocs(q);

    const scrapedEvents = snapshot.docs.map((doc) => ({
      scrapedEventId: doc.id,
      ...doc.data(),
    })) as ScrapedEventData[];

    scrapedEventServiceLogger.info(`Retrieved ${scrapedEvents.length} scraped events`);
    return scrapedEvents;
  } catch (error) {
    scrapedEventServiceLogger.error(`Error fetching scraped events: ${error}`);
    throw error;
  }
}
