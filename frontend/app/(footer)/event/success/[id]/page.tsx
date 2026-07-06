"use client";
import Loading from "@/components/loading/Loading";
import { EmptyEventData, EventId } from "@/interfaces/EventTypes";
import { FulfilmentSessionType } from "@/interfaces/FulfilmentTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { CheckIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";

export default function Success() {
  return (
    <Suspense fallback={<Loading />}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessPageLayout({
  eventId,
  eventName,
  eventImage,
  title,
  children,
  emailNote,
}: {
  eventId: EventId;
  eventName: string;
  eventImage: string;
  title: string;
  children: ReactNode;
  emailNote: string;
}) {
  const imageSrc = eventImage || null;

  return (
    <div className="min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] w-full flex items-center md:items-start justify-center bg-white py-12 md:pt-8 md:pb-12 px-4">
      <div className="w-full max-w-lg md:max-w-2xl border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        {imageSrc && (
          <div className="relative w-full aspect-video md:aspect-[21/9] bg-organiser-light-gray">
            <Image
              src={imageSrc}
              alt={eventName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        <div className="p-8 sm:p-10 text-center">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-core-text">
            <CheckIcon className="h-5 w-5 text-white stroke-[2.5]" />
          </div>

          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-core-text tracking-tight leading-snug">{title}</h1>

          <div className="mt-4 space-y-3 text-sm text-gray-600 font-light leading-relaxed">{children}</div>

          <div className="border-t border-gray-200 my-6" />

          <p className="text-xs text-gray-500 leading-relaxed">{emailNote}</p>

          <Link
            href={`/event/${eventId}`}
            className="mt-5 inline-block text-sm font-medium text-core-text underline underline-offset-4 decoration-core-outline hover:decoration-core-text transition-colors duration-200"
          >
            View event
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as EventId;
  const searchParams = useSearchParams();
  const fulfilmentSessionType = searchParams.get("fulfilmentSessionType");
  const isWaitlist = fulfilmentSessionType === FulfilmentSessionType.WAITLIST;
  const isBookingApproval = fulfilmentSessionType === FulfilmentSessionType.BOOKING_APPROVAL;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(EmptyEventData);
  useEffect(() => {
    getEventById(eventId).then((event) => {
      setEvent(event);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return <Loading />;
  }

  const layoutProps = {
    eventId,
    eventName: event.name,
    eventImage: event.image || event.thumbnail,
  };

  if (isWaitlist) {
    return (
      <SuccessPageLayout
        {...layoutProps}
        title="Thank you for expressing your interest!"
        emailNote="Please check your email for waitlist confirmation and event details. If you don't see it, check your spam or junk folder."
      >
        <p>
          You have successfully signed up for the waitlist for <span className="text-core-text font-medium">{event.name}</span>{" "}
          organised by {event.organiser.firstName}.
        </p>
        <p>We will notify you via email if spots open up for this event.</p>
      </SuccessPageLayout>
    );
  }

  if (isBookingApproval) {
    return (
      <SuccessPageLayout
        {...layoutProps}
        title="Booking request submitted!"
        emailNote="Please check your email for your booking request confirmation. If you don't see it, check your spam or junk folder."
      >
        <p>
          Thanks for booking <span className="text-core-text font-medium">{event.name}</span>. {event.organiser.firstName}{" "}
          will review and confirm your spot within 48 hours.
        </p>
        <p>We&apos;ll email you either way — your card won&apos;t be charged until approved.</p>
      </SuccessPageLayout>
    );
  }

  return (
    <SuccessPageLayout
      {...layoutProps}
      title="Thank you for booking with SPORTSHUB!"
      emailNote="Please check your email for your ticket details. If you don't see it, check your spam or junk folder."
    >
      <p>
        You have successfully booked <span className="text-core-text font-medium">{event.name}</span> organised by{" "}
        {event.organiser.firstName}.
      </p>
      <p>Keen to see you soon!</p>
    </SuccessPageLayout>
  );
}
