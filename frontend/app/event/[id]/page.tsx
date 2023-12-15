"use client";

import Loading from "@/components/Loading";
import EventBanner from "@/components/events/EventBanner";
import { EventDetails } from "@/components/events/EventDetails";
import RecommendedEvents from "@/components/events/RecommendedEvents";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import {
  getEventById,
  incrementEventAccessCountById,
} from "@/services/eventsService";
import { getTagById } from "@/services/tagService";
import { useEffect, useState } from "react";

export default function EventPage({ params }: any) {
  const eventId: EventId = params.id;
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [eventTags, setEventTags] = useState<Tag[]>([]);
  useEffect(() => {
    incrementEventAccessCountById(eventId);
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
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line
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
      <div className="mt-10 mb-10 mx-3">
        <EventDetails eventData={eventData} eventTags={eventTags} />

        <RecommendedEvents eventData={eventData} />
      </div>
    </div>
  );
}
