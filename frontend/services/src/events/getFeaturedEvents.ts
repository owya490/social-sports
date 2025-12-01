import { EventData } from "@/interfaces/EventTypes"; // Import EventData
import { PublicUserData } from "@/interfaces/UserTypes";
import { getPublicUserById } from "@/services/src/users/usersService";
import { collection, getDocs, query, where } from "firebase/firestore"; // Removed doc, getDoc
import { db } from "../firebase";
import { CollectionPaths, EventPrivacy, EventStatus } from "./eventsConstants";

export async function getFeaturedEvents(sport?: string): Promise<EventData[]> {
  console.log("Attempting to fetch featured events for sport:", sport);
  try {
    const eventsRef = collection(db, CollectionPaths.Events, EventStatus.Active, EventPrivacy.Public);
    let q;

    if (sport && sport !== "") {
      q = query(eventsRef, where("sport", "==", sport));
      console.log("Querying for specific sport:", sport);
    } else {
      // If no sport is specified or an empty string, fetch all active public events.
      q = query(eventsRef);
      console.log("Querying for all sports.");
    }

    const querySnapshot = await getDocs(q);
    console.log(`Raw query snapshot size: ${querySnapshot.size}, empty: ${querySnapshot.empty}`);
    console.log(
      `Query for ${sport || "all"} events found ${querySnapshot.size} documents. Is empty: ${querySnapshot.empty}`
    );
    const featuredEvents: EventData[] = [];

    for (const d of querySnapshot.docs) {
      const eventData = d.data();
      console.log("Processing event with ID:", d.id, "and data:", eventData);

      let organiser: PublicUserData | undefined = undefined;
      try {
        // Try to fetch the public user data. If it fails (e.g. permissions), we catch it and continue.
        // This allows us to display the name if possible, but fallback to ID if not.
        organiser = await getPublicUserById(eventData.organiserId);
      } catch (err) {
        console.warn(`Could not fetch organiser for event ${d.id}. Using fallback. Error:`, err);
      }

      featuredEvents.push({
        eventId: d.id,
        organiser: organiser,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        locationLatLng: eventData.locationLatLng,
        capacity: eventData.capacity,
        vacancy: eventData.vacancy,
        price: eventData.price,
        organiserId: eventData.organiserId,
        registrationDeadline: eventData.registrationDeadline,
        name: eventData.name,
        description: eventData.description,
        image: eventData.image,
        thumbnail: eventData.thumbnail,
        eventTags: eventData.eventTags,
        isActive: eventData.isActive,
        isPrivate: eventData.isPrivate,
        attendees: eventData.attendees || {},
        attendeesMetadata: eventData.attendeesMetadata || {},
        accessCount: eventData.accessCount,
        sport: eventData.sport,
        paymentsActive: eventData.paymentsActive,
        stripeFeeToCustomer: eventData.stripeFeeToCustomer,
        promotionalCodesEnabled: eventData.promotionalCodesEnabled,
        paused: eventData.paused,
        eventLink: eventData.eventLink,
        formId: eventData.formId || null,
        hideVacancy: eventData.hideVacancy || false,
      });
    }

    // Sort by popularity (using accessCount as a proxy for now) in descending order
    featuredEvents.sort((a, b) => b.accessCount - a.accessCount);

    return featuredEvents;
  } catch (error) {
    console.error("Error fetching featured events:", error);
    throw new Error("Failed to fetch featured events.");
  }
}
