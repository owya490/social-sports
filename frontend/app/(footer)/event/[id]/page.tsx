import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const eventId: EventId = params.id;

  const event = await getEventById(eventId, true, false);
  const imageSrc = event?.image || "";

  console.log("EDWIN", imageSrc);

  return {
    title: `SportsHub | Book your next sports session`,
    description: `SportsHub is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!`,
    openGraph: {
      title: `${event.name}`,
      description: `${event.description}`,
      images: [
        {
          url: imageSrc ? `/api/og/?src=${encodeURIComponent(imageSrc)}` : `/api/og/`,
          width: 1200,
          height: 630,
          alt: "Event Image",
        },
      ],
    },
  };
}

export default function Page({ params }: any) {
  return (
    <div>
      <EventPage params={params} />
    </div>
  );
}
