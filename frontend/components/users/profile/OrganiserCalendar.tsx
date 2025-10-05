"use client";
import CalendarEventCard from "@/components/users/profile/CalendarEventCard";
import { EventData } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  evaluateFulfilmentSessionEnabled,
  getNextFulfilmentEntityUrl,
  initFulfilmentSession,
} from "@/services/src/fulfilment/fulfilmentServices";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface OrganiserCalendarProps {
  organiser: PublicUserData;
  events: EventData[];
}

export default function OrganiserCalendar({ organiser, events }: OrganiserCalendarProps) {
  const router = useRouter();
  const logger = new Logger("OrganiserCalendarLogger");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);

  // Initialize on mount
  useEffect(() => {
    // Check if on mobile (screen width < 768px which is md breakpoint)
    const isMobile = window.innerWidth < 768;

    // Only set default selected date on desktop
    if (!isMobile) {
      const today = startOfDay(new Date());
      const thirtyDaysFromNow = addDays(today, 30);

      // Find the closest event within 30 days
      const upcomingEvents = events.filter((event) => {
        const eventDate = startOfDay(event.startDate.toDate());
        return eventDate >= today && eventDate <= thirtyDaysFromNow;
      });

      if (upcomingEvents.length > 0) {
        // Sort by date and select the closest one
        upcomingEvents.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
        setSelectedDate(startOfDay(upcomingEvents[0].startDate.toDate()));
      } else {
        // Default to today if no events in next 30 days
        setSelectedDate(today);
      }
    }

    // Initialize ticket counts to 1 for all events
    const initialTicketCounts: Record<string, number> = {};
    events.forEach((event) => {
      initialTicketCounts[event.eventId] = 1;
    });
    setTicketCounts(initialTicketCounts);
  }, [events]);

  // Get dates that have events
  const eventDates = useMemo(() => {
    return events.map((event) => startOfDay(event.startDate.toDate()));
  }, [events]);

  // Get events for the selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => {
      const eventDate = startOfDay(event.startDate.toDate());
      return isSameDay(eventDate, selectedDate);
    });
  }, [selectedDate, events]);

  // Handle date selection - show events list on mobile
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Check if on mobile (screen width < 768px which is md breakpoint)
    const isMobile = window.innerWidth < 768;
    if (isMobile && date) {
      setShowEventsList(true);
    }
  };

  // Handle back to calendar on mobile
  const handleBackToCalendar = () => {
    setShowEventsList(false);
  };

  // Handle booking
  const handleBookNow = async (eventId: string, numTickets: number) => {
    setLoading(true);
    try {
      if (evaluateFulfilmentSessionEnabled(organiser.userId, eventId)) {
        const { fulfilmentSessionId } = await initFulfilmentSession({
          type: "checkout",
          eventId: eventId,
          numTickets: numTickets,
        });

        if (!fulfilmentSessionId) {
          logger.error(`Failed to initialize fulfilment session for eventId: ${eventId}`);
          router.push("/error");
          return;
        }

        const nextEntityUrl = await getNextFulfilmentEntityUrl(fulfilmentSessionId);
        if (nextEntityUrl === undefined) {
          logger.error(`No url response received for fulfilmentSessionId: ${fulfilmentSessionId}`);
          router.push("/error");
          return;
        }

        router.push(nextEntityUrl);
      }
    } catch (error) {
      logger.error(`Error booking event: ${error}`);
      router.push("/error");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCountChange = (eventId: string, value: string | undefined) => {
    if (value) {
      setTicketCounts((prev) => ({ ...prev, [eventId]: parseInt(value) }));
    }
  };

  if (events.length === 0) {
    return null; // Don't show calendar if no events
  }

  return (
    <div className="py-8">
      <div className="md:flex gap-4 max-h-[400px]">
        {/* Mobile: Sliding View */}
        <div className="md:hidden w-full overflow-hidden">
          <div
            className={`flex transition-transform duration-300 ease-in-out ${
              showEventsList ? "-translate-x-1/2" : "translate-x-0"
            }`}
            style={{ width: "200%" }}
          >
            {/* Calendar View */}
            <div className="w-1/2 flex-shrink-0">
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const dateStart = startOfDay(date);
                    const today = startOfDay(new Date());
                    if (dateStart < today) return true;
                    return !eventDates.some((eventDate) => isSameDay(eventDate, dateStart));
                  }}
                  modifiers={{
                    hasEvent: eventDates,
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                    },
                  }}
                  classNames={{
                    today: ``,
                    selected: `bg-black border-black text-white rounded-full`,
                    chevron: `text-black`,
                  }}
                />
              </div>
            </div>

            {/* Events List View */}
            <div className="w-1/2 flex-shrink-0">
              <button onClick={handleBackToCalendar} className="mb-4 flex items-center gap-2 text-sm font-medium">
                <span>←</span> Back to Calendar
              </button>
              <div className="min-h-[300px]">
                <h3 className="text-xl font-semibold mb-4">
                  {selectedDate
                    ? `Events on ${selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}`
                    : "Select a date"}
                </h3>

                {eventsForSelectedDate.length === 0 ? (
                  <div className="text-center py-12">
                    <p>{selectedDate ? "No events on this day" : "Please select a date to view events"}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pb-12">
                    {eventsForSelectedDate.map((event) => (
                      <CalendarEventCard
                        key={event.eventId}
                        event={event}
                        ticketCount={ticketCounts[event.eventId] || 1}
                        loading={loading}
                        onTicketCountChange={(value) => handleTicketCountChange(event.eventId, value)}
                        onBookNow={() => handleBookNow(event.eventId, ticketCounts[event.eventId] || 1)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Side by Side View */}
        <div className="hidden md:flex gap-4 w-full">
          {/* Calendar */}
          <div className="md:w-1/2">
            <div className="flex md:pr-8">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const dateStart = startOfDay(date);
                  const today = startOfDay(new Date());
                  if (dateStart < today) return true;
                  return !eventDates.some((eventDate) => isSameDay(eventDate, dateStart));
                }}
                modifiers={{
                  hasEvent: eventDates,
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                  },
                }}
                classNames={{
                  today: ``,
                  selected: `bg-black border-black text-white rounded-full`,
                  chevron: `text-black`,
                }}
              />
            </div>
          </div>

          {/* Events List */}
          <div className="md:w-1/2">
            <div className="min-h-[300px]">
              <h3 className="text-xl font-semibold mb-4">
                {selectedDate
                  ? `Events on ${selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}`
                  : "Select a date"}
              </h3>

              {eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-12">
                  <p>{selectedDate ? "No events on this day" : "Please select a date to view events"}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {eventsForSelectedDate.map((event) => (
                    <CalendarEventCard
                      key={event.eventId}
                      event={event}
                      ticketCount={ticketCounts[event.eventId] || 1}
                      loading={loading}
                      onTicketCountChange={(value) => handleTicketCountChange(event.eventId, value)}
                      onBookNow={() => handleBookNow(event.eventId, ticketCounts[event.eventId] || 1)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
