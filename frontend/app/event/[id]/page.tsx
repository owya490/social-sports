"use client";

import EventBanner from "@/components/events/EventBanner";
import { EventDetails } from "@/components/events/EventDetails";
import RecommendedEvents from "@/components/events/RecommendedEvents";
import Loading from "@/components/loading/Loading";
import MobileEventDetailFooter from "@/components/mobile/MobileEventDetailFooter";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import {
  getEventById,
  incrementEventAccessCountById,
} from "@/services/src/events/eventsService";
import { getTagById } from "@/services/src/tagService";
import { useEffect, useState } from "react";

export default function EventPage({ params }: any) {
  const eventId: EventId = params.id;
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [eventTags, setEventTags] = useState<Tag[]>([]);
  useEffect(() => {
    getEventById(eventId)
      .then((event) => {
        setEventData(event);
        if (event.eventTags && typeof event.eventTags === "object") {
          event.eventTags.map((tagId) => {
            getTagById(tagId).then((tag) => {
              setEventTags([...eventTags, tag]);
            });
          });
        }

        incrementEventAccessCountById(
          eventId,
          1,
          event.isActive,
          event.isPrivate
        );
      })
      .finally(() => {
        setLoading(false);
      });

    //  eslint-disable-next-line
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div className="text-black">
      <EventBanner
        name={eventData.name}
        startDate={eventData.startDate}
        organiser={eventData.organiser}
        vacancy={eventData.vacancy}
      />
      <div className="mt-5 lg:mt-10 mb-10">
        <EventDetails eventData={eventData} eventTags={eventTags} setLoading={setLoading} />

        <RecommendedEvents eventData={eventData} />
      </div>
      <div className="lg:hidden">
        <MobileEventDetailFooter date={eventData.startDate} />
      </div>
    </div>
  );
}
