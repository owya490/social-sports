import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { getEventIdFromCustomEventLink } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getEventById } from "@/services/src/events/eventsService";
import { generateEventPageMetadata } from "@/services/src/events/eventsUtils/commonEventsUtils";
import { getUsernameMapping } from "@/services/src/users/usersService";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string; customEventLink: string };
}): Promise<Metadata> {
  const { username, customEventLink } = getUsernameAndEventLink(params);
  const eventId = await getEventIdFromUserAndEventLink(username, customEventLink);
  const event = await getEventById(eventId, true, false);

  return generateEventPageMetadata(event);
}

export default async function Page({ params }: any) {
  // The first param is the username actually, and the second param is the customEventLink
  const { username, customEventLink } = getUsernameAndEventLink(params);
  const eventId = await getEventIdFromUserAndEventLink(username, customEventLink);

  return <EventPage params={{ id: eventId }} />;
}

function getUsernameAndEventLink(params: any) {
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
