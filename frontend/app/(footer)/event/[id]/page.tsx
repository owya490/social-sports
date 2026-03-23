import EventPage from "@/components/events/EventPage";
import { EventId } from "@/interfaces/EventTypes";
import { generateEventPageMetadata } from "@/services/src/events/eventsUtils/commonEventsUtils";
import { getEventById } from "@/services/src/events/eventsService";
import { Metadata } from "next";
import { notFound } from "next/navigation";

function toEventId(value: string): EventId {
  if (!value.trim()) {
    notFound();
  }

  return value as EventId;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const eventId = toEventId(params.id);
  const event = await getEventById(eventId, true, false);

  return generateEventPageMetadata(event);
}

export default function Page({ params }: { params: { id: string } }) {
  return <EventPage eventId={toEventId(params.id)} />;
}
