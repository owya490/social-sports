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

type EventPageParams = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: EventPageParams }): Promise<Metadata> {
  const { id } = await params;
  const eventId = toEventId(id);
  const event = await getEventById(eventId, true, false);

  return generateEventPageMetadata(event);
}

export default async function Page({ params }: { params: EventPageParams }) {
  const { id } = await params;
  return <EventPage eventId={toEventId(id)} />;
}
