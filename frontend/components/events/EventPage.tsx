"use client";

import EventBanner from "@/components/events/EventBanner";
import { EventDetails } from "@/components/events/EventDetails";
import EventImage from "@/components/events/EventImage";
import RecommendedEvents from "@/components/events/RecommendedEvents";
import Loading from "@/components/loading/Loading";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { URL } from "@/interfaces/Types";
import { getEventById, incrementEventAccessCountById } from "@/services/src/events/eventsService";
import { getTagById } from "@/services/src/tagService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventPage({ params }: any) {
  const eventId: EventId = params.id;
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [eventTags, setEventTags] = useState<Tag[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (eventId === "404") {
      router.push("/not-found");
      return;
    }

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

        incrementEventAccessCountById(eventId, 1, event.isActive, event.isPrivate);
      })
      .finally(() => {
        setLoading(false);
      })
      .catch(() => {
        router.push("/error");
      });

    //  eslint-disable-next-line
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <>
      {/* Hero Image Section */}
      <div className="w-full">
        <div className="flex justify-center">
          <div className="w-full md:screen-width-primary">
            <div className="px-4 py-4 md:px-0 md:py-6">
              <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-sm md:mx-12">
                <EventImage imageSrc={eventData.image as URL} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Banner with title and organiser info */}
      <EventBanner
        name={eventData.name}
        startDate={eventData.startDate}
        organiser={eventData.organiser}
        vacancy={eventData.vacancy}
        hideVacancy={eventData.hideVacancy}
      />

      {/* Event Details */}
      <div className="mt-1 mb-10">
        <EventDetails eventData={eventData} eventTags={eventTags} setLoading={setLoading} />
        {/* Stub for Orgnaiser on Event Page
        <div className="w-full flex justify-center">
          <div className="md:screen-width-primary">Owen</div>
        </div> */}
        <RecommendedEvents eventData={eventData} />
      </div>
      {/* SPORTSHUB-194 Mobile Event footer will be re-enabled post MVP
      <div className="lg:hidden">
        <MobileEventDetailFooter date={eventData.startDate} />
      </div> */}
    </>
  );
}
