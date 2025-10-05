"use client";
import { HighlightButton, InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { EventData } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Option, Select } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_TICKETS_PER_ORDER = 7;

interface CalendarEventCardProps {
  event: EventData;
  ticketCount: number;
  loading: boolean;
  onTicketCountChange: (value: string | undefined) => void;
  onBookNow: () => void;
}

export default function CalendarEventCard({
  event,
  ticketCount,
  loading,
  onTicketCountChange,
  onBookNow,
}: CalendarEventCardProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  const handleContactClick = () => {
    if (event.eventLink) {
      setOpenModal(true);
    } else {
      console.warn("No event link provided!");
    }
  };

  return (
    <div className="p-4">
      {/* Mobile Layout (below md) */}
      <div className="md:hidden">
        {/* Title */}
        <h4
          className="font-bold text-lg mb-3 cursor-pointer hover:underline overflow-x-hidden"
          onClick={() => router.push(`/event/${event.eventId}`)}
        >
          {event.name}
        </h4>

        {/* Image and Metadata in line */}
        <div className="flex gap-4 mb-4">
          {/* Event Thumbnail */}
          <div className="flex-shrink-0">
            <Image
              src={event.thumbnail || event.image}
              alt={event.name}
              width={0}
              height={0}
              className="object-cover w-24 h-24 aspect-square rounded-lg"
            />
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-2 overflow-x-hidden">
            <div className="flex items-center">
              <p className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(event.startDate)}</p>
              <p className="font-light text-gray-500 text-xs ml-auto">${displayPrice(event.price)}</p>
            </div>

            <div className="flex items-center">
              <MapPinIcon className="w-4 shrink-0" />
              <p className="ml-1 font-light text-xs whitespace-nowrap overflow-hidden">{event.location}</p>
            </div>

            <p className="text-xs text-gray-500">
              {event.vacancy} {event.vacancy === 1 ? "spot" : "spots"} left
            </p>
          </div>
        </div>

        {/* Ticket Selection and Book Now */}
        {event.paymentsActive ? (
          <div className="flex items-center gap-3">
            <Select value={ticketCount.toString()} onChange={onTicketCountChange} label="Tickets" disabled={loading}>
              {Array.from({ length: Math.min(event.vacancy, MAX_TICKETS_PER_ORDER) }, (_, i) => i + 1).map((num) => (
                <Option key={num} value={num.toString()}>
                  {num}
                </Option>
              ))}
            </Select>

            <HighlightButton
              onClick={onBookNow}
              className="flex-1"
              text={loading ? "Booking..." : "Book Now"}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="flex justify-end">
            <InvertedHighlightButton onClick={handleContactClick} className="border border-black" text="Contact Now" />
          </div>
        )}
      </div>

      {/* Desktop Layout (above md) - Image spans all rows on left */}
      <div className="hidden md:flex gap-4">
        {/* Event Thumbnail - spans full height */}
        <div className="flex-shrink-0">
          <Image
            src={event.thumbnail || event.image}
            alt={event.name}
            width={0}
            height={0}
            className="object-cover w-40 h-full aspect-square rounded-lg"
          />
        </div>

        {/* Right side - 3 rows */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Row 1: Title */}
          <h4
            className="font-bold text-lg cursor-pointer hover:underline overflow-x-hidden"
            onClick={() => router.push(`/event/${event.eventId}`)}
          >
            {event.name}
          </h4>

          {/* Row 2: Metadata */}
          <div className="space-y-2 overflow-x-hidden">
            <div className="flex items-center">
              <p className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(event.startDate)}</p>
              <p className="font-light text-gray-500 text-xs ml-auto">${displayPrice(event.price)}</p>
            </div>

            <div className="flex items-center">
              <MapPinIcon className="w-4 shrink-0" />
              <p className="ml-1 font-light text-xs whitespace-nowrap overflow-hidden">{event.location}</p>
            </div>

            <p className="text-xs text-gray-500">
              {event.vacancy} {event.vacancy === 1 ? "spot" : "spots"} left
            </p>
          </div>

          {/* Row 3: Ticket Selection and Book Now */}
          {event.paymentsActive ? (
            <div className="flex items-center gap-3">
              <Select value={ticketCount.toString()} onChange={onTicketCountChange} label="Tickets" disabled={loading}>
                {Array.from({ length: Math.min(event.vacancy, MAX_TICKETS_PER_ORDER) }, (_, i) => i + 1).map((num) => (
                  <Option key={num} value={num.toString()}>
                    {num}
                  </Option>
                ))}
              </Select>

              <HighlightButton
                onClick={onBookNow}
                className="flex-1"
                text={loading ? "Booking..." : "Book Now"}
                disabled={loading}
              />
            </div>
          ) : (
            <div className="flex justify-end">
              <InvertedHighlightButton
                onClick={handleContactClick}
                className="border border-black"
                text="Contact Now"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={openModal} handler={setOpenModal}>
        <DialogHeader className="mx-2 text-lg font-medium leading-6">Contact Event Organizer</DialogHeader>
        <DialogBody>
          <p className="mx-2 text-base font-medium text-black">You are going to be redirected to:</p>
          <p className="mx-2 text-base font-medium text-blue-900">{event.eventLink}</p>
        </DialogBody>
        <DialogFooter className="flex justify-between">
          <Button className="mx-2 bg-gray-200" variant="text" color="black" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button
            className="ml-2"
            variant="filled"
            color="black"
            onClick={() => {
              window.open(event.eventLink, "_blank", "noopener,noreferrer");
              setOpenModal(false);
            }}
          >
            Proceed
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
