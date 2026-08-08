import { EventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";

export function splitEventsByTime(events: EventData[], nowSeconds = Timestamp.now().seconds) {
  const upcoming = events
    .filter((event) => event.startDate.seconds - nowSeconds > 0)
    .sort((a, b) => a.startDate.seconds - b.startDate.seconds);
  const past = events
    .filter((event) => event.startDate.seconds - nowSeconds <= 0)
    .sort((a, b) => b.startDate.seconds - a.startDate.seconds);
  return { upcoming, past };
}
