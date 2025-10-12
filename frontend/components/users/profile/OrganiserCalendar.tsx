"use client";
import CalendarEventCard from "@/components/users/profile/CalendarEventCard";
import { ScreenSize, useScreenSize } from "@/components/utility/ScreenSize";
import { EventData } from "@/interfaces/EventTypes";
import { isSameDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface OrganiserCalendarProps {
  events: EventData[];
}

export default function OrganiserCalendar({ events }: OrganiserCalendarProps) {
  const { isAtOrBelow } = useScreenSize();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [showEventsList, setShowEventsList] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (events.length > 0) {
      const today = startOfDay(new Date());

      // Find all upcoming events (no date limit)
      const upcomingEvents = events.filter((event) => {
        const eventDate = startOfDay(event.startDate.toDate());
        return eventDate >= today;
      });

      if (upcomingEvents.length > 0) {
        // Sort by date and get the closest one
        upcomingEvents.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
        const closestEventDate = startOfDay(upcomingEvents[0].startDate.toDate());

        if (isAtOrBelow(ScreenSize.MD)) {
          // On mobile/tablet: navigate to first event month but don't select date
          setMonth(closestEventDate);
        } else {
          // On desktop: select the date and navigate to its month
          setSelectedDate(closestEventDate);
          setMonth(closestEventDate);
        }
      }
    }
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
    if (date) {
      setMonth(date);
    }
    // Show events list on mobile/tablet when a date is selected
    if (isAtOrBelow(ScreenSize.MD) && date) {
      setShowEventsList(true);
    }
  };

  // Handle back to calendar on mobile
  const handleBackToCalendar = () => {
    setShowEventsList(false);
  };

  return (
    <div className="pt-8">
      <div className="md:flex gap-4 max-h-[430px]">
        {/* Mobile: Sliding View */}
        <div className="md:hidden w-full overflow-hidden">
          {events.length === 0 && (
            <p className="text-sm font-light text-gray-500 mb-4">No upcoming events for this organiser</p>
          )}
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
                  month={month}
                  onMonthChange={setMonth}
                  disabled={(date) => {
                    if (events.length === 0) return true;
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
              <button
                type="button"
                onClick={handleBackToCalendar}
                className="mb-4 flex items-center gap-2 text-sm font-medium"
              >
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
                  <div className="space-y-4 pb-12">
                    {eventsForSelectedDate.map((event) => (
                      <CalendarEventCard key={event.eventId} event={event} />
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
          <div className="flex-shrink-0">
            <div className="flex md:pr-8">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={(date) => {
                  if (events.length === 0) return true;
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
          <div className="flex-1">
            {events.length === 0 ? (
              /* Desktop: Empty state message on right */
              <div className="min-h-[300px] flex items-start pt-12">
                <p className="text-sm font-light text-gray-500">No upcoming events for this organiser</p>
              </div>
            ) : (
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
                  <div className="space-y-4 max-h-[430px] overflow-y-auto">
                    {eventsForSelectedDate.map((event) => (
                      <CalendarEventCard key={event.eventId} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
