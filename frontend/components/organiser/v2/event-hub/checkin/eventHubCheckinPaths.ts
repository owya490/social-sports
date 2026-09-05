import { EventId } from "@/interfaces/EventTypes";
import {
  isWelcomeFlowPath,
  WELCOME_PATH,
  welcomeEventPath,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";

export function eventHubCheckinPath(eventId: EventId | string): string {
  return `/organiser/v2/event/${eventId}/checkin`;
}

export function welcomeAwareCheckinHref(pathname: string, eventId: EventId | string): string {
  if (isWelcomeFlowPath(pathname)) {
    return `${WELCOME_PATH}/event/${eventId}/checkin`;
  }
  return eventHubCheckinPath(eventId);
}

export function eventHubFromCheckinPath(pathname: string, eventId: EventId | string): string {
  if (isWelcomeFlowPath(pathname)) {
    return welcomeEventPath(String(eventId));
  }
  return `/organiser/v2/event/${eventId}`;
}
