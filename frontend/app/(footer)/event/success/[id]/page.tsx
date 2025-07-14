"use client";
import Loading from "@/components/loading/Loading";
import { EmptyEventData, EventId } from "@/interfaces/EventTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { useEffect, useState } from "react";

/**
 * Displays a booking confirmation message for a sports event after fetching event details by ID.
 *
 * Shows a loading indicator while retrieving event data, then presents a thank-you message with event and organiser information upon completion.
 */

export default function Success({ params }: any) {
  const eventId: EventId = params.id;
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(EmptyEventData);
  useEffect(() => {
    getEventById(eventId).then((event) => {
      setEvent(event);
      setLoading(false);
    });
  }, []);
  return loading ? (
    <Loading />
  ) : (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="text-center">
        <h2 className="text-2xl">Thank you for booking with SportsHub!</h2>
        <p className="font-light">
          You have successfully booked {event.name} organised by {event.organiser.firstName}.
        </p>
        <p className="font-light">Keen to see you soon!</p>
        <p className="text-xs text-gray-500 mt-4">
          Please check your email for your ticket details. If you don&apos;t see it, check your spam or junk folder.
        </p>
      </div>
    </div>
  );
}
