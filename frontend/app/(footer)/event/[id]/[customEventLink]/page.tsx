import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { getEventIdFromCustomEventLink } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getEventById } from "@/services/src/events/eventsService";
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
  const imageSrc = event?.image || "";
  const title = event?.name;
  return {
    title: `SportsHub | Book your next sports session`,
    description: `SportsHub is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!`,
    openGraph: {
      title: `${event.name}`,
      description: `${event.description}`,
      images: [
        {
          url: imageSrc
            ? `/api/og/?src=${encodeURIComponent(imageSrc)}&title=${encodeURIComponent(title)}`
            : `/api/og/`,
          width: 1200,
          height: 630,
          alt: "Event Image",
        },
      ],
    },
  };
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
  } catch (error) {
    console.error(error);
    return "404";
  }
}
