"use client";
import EventCard from "@/components/EventCard";
import FilterBanner from "@/components/Filter/FilterBanner";
import Loading from "@/components/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { getAllEvents, getEventById } from "@/services/eventsService";
import { useEffect, useState } from "react";
import { searchEventsByKeyword } from "@/services/eventsService";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export const EMPTY_SEARCH_STRING = "";
export const EMPTY_LOCATION_STRING = "";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
    const [eventDataList, setEventDataList] = useState<EventData[]>([]);
    const [searchDataList, setSearchDataList] = useState<EventData[]>([]);
    const [currentUrl, setCurrentUrl] = useState(
        typeof window !== "undefined" ? window.location.href : ""
    );
    const searchParams = useSearchParams();
    const [srcLocation, setSrcLocation] = useState<string>("");
    // useEffect(() => {
    //   getAllEvents()
    //     .then((events) => {
    //       setEventDataList(events);
    //       setAllEventsDataList(events);
    //     })
    //     .finally(() => {
    //       setLoading(false);
    //     });
    // }, []);
    const getQueryParams = () => {
        if (typeof window === "undefined") {
            // Return some default or empty values when not in a browser environment
            return { event: "", location: "" };
        }
        const searchParams = new URLSearchParams(window.location.search);
        setSrcLocation(searchParams.get("location") || "");
        return {
            event: searchParams.get("event") || "",
            location: searchParams.get("location") || "",
        };
    };

    useEffect(() => {
        setLoading(true);
        console.log("test");
        const { event, location } = getQueryParams();
        if (typeof event === "string" && typeof location === "string") {
            if (event === "") {
                getAllEvents()
                    .then((events) => {
                        setEventDataList(events);
                        setSearchDataList(events);
                        setAllEventsDataList(events);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                searchEventsByKeyword(event, location)
                    .then(async (events) => {
                        let tempEventDataList: EventData[] = [];
                        for (const singleEvent of events) {
                            const eventData = await getEventById(
                                singleEvent.eventId
                            );
                            tempEventDataList.push(eventData);
                        }
                        return tempEventDataList;
                    })
                    .then((tempEventDataList: EventData[]) => {
                        setEventDataList(tempEventDataList);
                        setSearchDataList(tempEventDataList);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        }
    }, [searchParams]);

    return loading ? (
        <Loading />
    ) : (
        <div>
            <div className="flex justify-center">
                <FilterBanner
                    eventDataList={searchDataList}
                    allEventsDataList={allEventsDataList}
                    setEventDataList={setEventDataList}
                    srcLocation={srcLocation}
                    setSrcLocation={setSrcLocation}
                />
            </div>
            <div className="flex justify-center">
                <div className="pb-10 screen-width-dashboard">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {eventDataList
                            .sort((event1, event2) => {
                                if (event1.accessCount > event2.accessCount) {
                                    return 1;
                                }
                                if (event2.accessCount < event2.accessCount) {
                                    return -1;
                                }
                                return 0;
                            })
                            .map((event, eventIdx) => {
                                return (
                                    <div className="my-4" key={eventIdx}>
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
            </div>
        </div>
    );
}
