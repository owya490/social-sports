"use client";
import EventCard from "@/components/EventCard";
import Loading from "@/components/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents } from "@/services/eventsService";
import { useEffect, useState } from "react";
import { searchEventsByKeyword } from "@/services/eventsService";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState<EventData[]>([]);

    const getQueryParams = () => {
        const searchParams = new URLSearchParams(window.location.search);
        return {
            event: searchParams.get("event") || "",
            location: searchParams.get("location") || "",
        };
    };
    const { event, location } = getQueryParams();

    useEffect(() => {
        if (event === "" && location === "") {
            getAllEvents()
                .then((events) => {
                    setEventData(events);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            console.log("check");
            searchEventsByKeyword(event, location)
                .then((events) => {
                    setEventData(events);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, []);

    return loading ? (
        <Loading />
    ) : (
        <div className="pt-20 pb-10 mx-[05vw] lg:mx-[3vw] xl:mx-[2vw]">
            <div className="flex flex-wrap justify-center">
                {eventData.map((event, eventIdx) => {
                    return (
                        <div className="m-4" key={eventIdx}>
                            <EventCard
                                eventId={event.eventId}
                                image={event.image}
                                name={event.name}
                                organiser={event.organiser}
                                startTime={event.startDate}
                                location={event.location}
                                price={event.price}
                                vacancy={event.vacancy}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
