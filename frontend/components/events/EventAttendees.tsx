"use client";

import {
  type EventAttendeeNameAndTicketCount,
  getEventAttendeeNames,
} from "@/services/src/attendee/attendeeService";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ViewAllAttendeesModal } from "./ViewAllAttendeesModal";

interface EventAttendeesProps {
  eventId: string;
  showAttendeesOnEventPage: boolean;
}

const MOBILE_PREVIEW_COUNT = 8;
const DESKTOP_PREVIEW_COUNT = 6;

export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function EventAttendees({ eventId, showAttendeesOnEventPage }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<EventAttendeeNameAndTicketCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState(DESKTOP_PREVIEW_COUNT);

  useEffect(() => {
    if (!showAttendeesOnEventPage || !eventId) {
      setLoading(false);
      return;
    }

    getEventAttendeeNames(eventId)
      .then((data) => setAttendees(data))
      .catch(() => setAttendees([]))
      .finally(() => setLoading(false));
  }, [eventId, showAttendeesOnEventPage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setPreviewCount(event.matches ? DESKTOP_PREVIEW_COUNT : MOBILE_PREVIEW_COUNT);
    };

    setPreviewCount(mediaQuery.matches ? DESKTOP_PREVIEW_COUNT : MOBILE_PREVIEW_COUNT);
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  if (!showAttendeesOnEventPage) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Who&apos;s going</h3>
        <div className="grid w-full grid-cols-4 gap-3 md:grid-cols-6">
          {Array.from({ length: previewCount }).map((_, index) => (
            <div
              key={index}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-3 flex flex-col items-center gap-2"
            >
              <Skeleton circle height={40} width={40} />
              <Skeleton height={10} width={60} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Who&apos;s going</h3>
        <div className="text-sm text-gray-500">No attendees yet</div>
      </div>
    );
  }

  const previewAttendees = attendees.slice(0, previewCount);
  const hasMore = attendees.length > previewCount;

  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Who&apos;s going</h3>
      <div className="grid w-full grid-cols-4 gap-3 md:grid-cols-6">
        {previewAttendees.map((attendee, index) => (
          <div
            key={`${attendee.name}-${index}`}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-3 flex flex-col items-center gap-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 font-medium">
              {getInitial(attendee.name)}
            </div>
            <span className="text-sm text-gray-700 w-full truncate text-center" title={attendee.name}>
              {attendee.name}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setModalOpen(true)}
          className="mt-3 text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-700"
        >
          View all ({attendees.length})
        </button>
      )}
      <ViewAllAttendeesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        attendees={attendees}
      />
    </div>
  );
}
