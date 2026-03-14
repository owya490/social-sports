import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { generateEventPageMetadata } from "@/services/src/events/eventsUtils/commonEventsUtils";
import { getEventById } from "@/services/src/events/eventsService";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const eventId = params.id as EventId;
  const event = await getEventById(eventId, true, false);

  return generateEventPageMetadata(event);
}

export default function Page({ params }: any) {
  return <EventPage params={params} />;
}
