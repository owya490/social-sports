"use client";

import Loading from "@/components/loading/Loading";
import { EmptyEventData, EventId } from "@/interfaces/EventTypes";
import { getEventById } from "@/services/src/events/eventsService";
import {
  getWaitlistEntryByHash,
  removeFromWaitlistByHash,
} from "@/services/src/waitlist/waitlistService";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export default function WaitlistRemovePage() {
  return (
    <Suspense fallback={<Loading />}>
      <WaitlistRemoveContent />
    </Suspense>
  );
}

type PageState = "loading" | "not-found" | "found" | "confirming" | "removed" | "error";

function WaitlistRemoveContent() {
  const params = useParams<{ eventId: string; emailHash: string }>();
  const eventId = params.eventId as EventId;
  const emailHash = params.emailHash;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [entryName, setEntryName] = useState("");
  const [entryEmail, setEntryEmail] = useState("");
  const [entryTicketCount, setEntryTicketCount] = useState(0);
  const [eventName, setEventName] = useState("");
  const [eventData, setEventData] = useState(EmptyEventData);

  useEffect(() => {
    async function fetchData() {
      try {
        const [entryResponse, event] = await Promise.all([
          getWaitlistEntryByHash(eventId, emailHash),
          getEventById(eventId),
        ]);

        setEventData(event);
        setEventName(event.name);

        if (!entryResponse.found) {
          setPageState("not-found");
          return;
        }

        setEntryName(entryResponse.name);
        setEntryEmail(entryResponse.email);
        setEntryTicketCount(entryResponse.ticketCount);
        setPageState("found");
      } catch {
        setPageState("error");
      }
    }

    fetchData();
  }, [eventId, emailHash]);

  const handleRemove = async () => {
    setPageState("confirming");
    try {
      const response = await removeFromWaitlistByHash(eventId, emailHash);
      if (response.success) {
        setPageState("removed");
      } else {
        setPageState("error");
      }
    } catch {
      setPageState("error");
    }
  };

  if (pageState === "loading") {
    return <Loading />;
  }

  if (pageState === "not-found") {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-semibold mb-3">Not on the waitlist</h2>
          <p className="font-light text-gray-600">
            We couldn&apos;t find a waitlist entry for this event. You may have already been removed,
            or the link may be invalid.
          </p>
          {eventId && (
            <Link
              href={`/event/${eventId}`}
              className="mt-6 inline-block text-sm text-blue-600 hover:underline"
            >
              Back to event
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (pageState === "removed") {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-semibold mb-3">You&apos;ve been removed</h2>
          <p className="font-light text-gray-600">
            You have been successfully removed from the waitlist for{" "}
            <span className="font-medium">{eventName}</span>.
          </p>
          <Link
            href={`/event/${eventId}`}
            className="mt-6 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to event
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-semibold mb-3">Something went wrong</h2>
          <p className="font-light text-gray-600">
            We couldn&apos;t process your request. Please try again later.
          </p>
          {eventId && (
            <Link
              href={`/event/${eventId}`}
              className="mt-6 inline-block text-sm text-blue-600 hover:underline"
            >
              Back to event
            </Link>
          )}
        </div>
      </div>
    );
  }

  // found or confirming state
  const isConfirming = pageState === "confirming";

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="max-w-md w-full mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-2">Leave Waitlist</h2>
        <p className="text-gray-600 font-light mb-6">
          You are on the waitlist for{" "}
          <span className="font-medium">{eventName || eventData.name}</span>.
        </p>

        <div className="bg-gray-50 rounded-lg p-5 mb-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{entryName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{entryEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Spots requested</span>
            <span className="font-medium">{entryTicketCount}</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Removing yourself from the waitlist is permanent. You will no longer be notified if spots
          become available.
        </p>

        <button
          onClick={handleRemove}
          disabled={isConfirming}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isConfirming ? "Removing..." : "Leave Waitlist"}
        </button>

        <Link
          href={`/event/${eventId}`}
          className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Cancel — keep my spot
        </Link>
      </div>
    </div>
  );
}
