"use client";
import Loading from "@/components/loading/Loading";
import { EmptyEventData, EventId } from "@/interfaces/EventTypes";
import { FulfilmentSessionType } from "@/interfaces/FulfilmentTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Error components must be Client Components

export default function Success({ params }: any) {
  const eventId: EventId = params.id;
  const searchParams = useSearchParams();
  const fulfilmentSessionType = searchParams.get("fulfilmentSessionType");
  const isWaitlist = fulfilmentSessionType === FulfilmentSessionType.WAITLIST;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(EmptyEventData);
  useEffect(() => {
    getEventById(eventId).then((event) => {
      setEvent(event);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (isWaitlist) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl">Thank you for expressing your interest!</h2>
          <p className="font-light">
            You have successfully signed up for the waitlist for {event.name} organised by {event.organiser.firstName}.
          </p>
          <p className="font-light">We will notify you via email if spots open up for this event.</p>
          <p className="text-xs text-gray-500 mt-4">
            Please check your email for waitlist confirmation and event details. If you don&apos;t see it, check your spam or junk folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="text-center">
        <h2 className="text-2xl">Thank you for booking with SPORTSHUB!</h2>
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
