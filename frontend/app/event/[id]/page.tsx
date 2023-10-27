"use client";

import Loading from "@/components/Loading";
import EventBanner from "@/components/events/EventBanner";
import { EventDetails } from "@/components/events/EventDetails";
import RecommendedEvents from "@/components/events/RecommendedEvents";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { getEventById } from "@/services/eventsService";
import { getTagById } from "@/services/tagService";
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
                event.eventTags.map((tagId) => {
                    getTagById(tagId).then((tag) => {
                        setEventTags([...eventTags, tag]);
                    });
                });
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
            <div className="mt-10 mx-[5vw] lg:mx-[2vw] xl:mx-[3vw]">
                <EventDetails eventData={eventData} eventTags={eventTags} />
                <div className="mx-4 lg:mx-16">
                    <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
                    <div className="flex my-5">
                        <h5 className="font-bold text-lg">
                            Similar events nearby
                        </h5>
                        <a className="text-sm font-light ml-auto cursor-pointer">
                            See all
                        </a>
                    </div>
                    <div className="flex space-x-5">
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                    </div>
                </div>
            </div>
        </div>
    );
}
