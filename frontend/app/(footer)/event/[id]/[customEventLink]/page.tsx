import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { getEventIdFromCustomEventLink } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getEventById } from "@/services/src/events/eventsService";
import { generateEventPageMetadata } from "@/services/src/events/eventsUtils/commonEventsUtils";
import { getUsernameMapping } from "@/services/src/users/usersService";
import { Metadata } from "next";

type EventPageParams = Promise<{ id: string; customEventLink: string }>;

export async function generateMetadata({
  params,
}: {
  params: EventPageParams;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { username, customEventLink } = getUsernameAndEventLink(resolvedParams);
  const eventId = await getEventIdFromUserAndEventLink(username, customEventLink);
  const event = await getEventById(eventId, true, false);

  return generateEventPageMetadata(event);
}

export default async function Page({ params }: { params: EventPageParams }) {
  // The first param is the username actually, and the second param is the customEventLink
  const resolvedParams = await params;
  const { username, customEventLink } = getUsernameAndEventLink(resolvedParams);
  const eventId = await getEventIdFromUserAndEventLink(username, customEventLink);

  return <EventPage eventId={eventId} />;
}

function getUsernameAndEventLink(params: { id: string; customEventLink: string }) {
  const username = params.id;
  const customEventLink = params.customEventLink;
  return { username, customEventLink };
}

async function getEventIdFromUserAndEventLink(username: string, customEventLink: string): Promise<EventId> {
  try {
    const userId = (await getUsernameMapping(username)).userId;
    const eventId = await getEventIdFromCustomEventLink(userId, customEventLink);
    return eventId;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return "404" as EventId;
  }
}
