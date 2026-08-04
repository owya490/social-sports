import { EventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";

export type OrganiserDashboardStats = {
  upcomingCount: number;
  pastCount: number;
  activeCount: number;
  totalViews: number;
  spotsFilled: number;
  capacityTotal: number;
};

export function splitEventsByTime(events: EventData[], nowSeconds = Timestamp.now().seconds) {
  const upcoming = events
    .filter((event) => event.startDate.seconds - nowSeconds > 0)
    .sort((a, b) => a.startDate.seconds - b.startDate.seconds);
  const past = events
    .filter((event) => event.startDate.seconds - nowSeconds <= 0)
    .sort((a, b) => b.startDate.seconds - a.startDate.seconds);
  return { upcoming, past };
}

export function computeOrganiserDashboardStats(events: EventData[]): OrganiserDashboardStats {
  const nowSeconds = Timestamp.now().seconds;
  const { upcoming, past } = splitEventsByTime(events, nowSeconds);

  const spotsFilled = events.reduce((sum, event) => {
    const filled = Math.max(0, event.capacity - event.vacancy);
    return sum + filled;
  }, 0);

  const capacityTotal = events.reduce((sum, event) => sum + Math.max(0, event.capacity), 0);

  return {
    upcomingCount: upcoming.length,
    pastCount: past.length,
    activeCount: events.filter((event) => event.isActive && !event.paused).length,
    totalViews: events.reduce((sum, event) => sum + (event.accessCount || 0), 0),
    spotsFilled,
    capacityTotal,
  };
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}
