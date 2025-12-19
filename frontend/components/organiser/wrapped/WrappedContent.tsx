"use client";

import { SportshubWrapped } from "@/interfaces/WrappedTypes";
import { EventsCreatedSection } from "./sections/EventsCreatedSection";
import { EventViewsSection } from "./sections/EventViewsSection";
import { FeesSavedSection } from "./sections/FeesSavedSection";
import { HeroSection } from "./sections/HeroSection";
import { MostPopularEventSection } from "./sections/MostPopularEventSection";
import { TicketsSoldSection } from "./sections/TicketsSoldSection";
import { TimeSavedSection } from "./sections/TimeSavedSection";
import { TopAttendeesSection } from "./sections/TopAttendeesSection";
import { TotalSalesSection } from "./sections/TotalSalesSection";

const WRAPPED_YEAR = 2025;

/**
 * Helper to check if a value is present and non-zero
 */
export const hasValue = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined && value > 0;
};

interface WrappedContentProps {
  data: SportshubWrapped;
  footerSection: React.ReactNode;
  headerElements?: React.ReactNode;
  className?: string;
}

/**
 * Shared component for rendering wrapped content sections.
 * Used by both the organiser's private view and the public share view.
 */
export function WrappedContent({ data, footerSection, headerElements, className = "" }: WrappedContentProps) {
  const hasTopAttendees = data.topRegularAttendees && data.topRegularAttendees.length > 0;
  const hasMostPopularEvent = data.mostPopularEvent && data.mostPopularEvent.eventId;

  return (
    <main id="wrapped-container" className={`bg-white ${className}`}>
      {headerElements}

      <HeroSection
        organiserName={data.organiserName || "Organiser"}
        year={data.year || WRAPPED_YEAR}
        dateRange={data.dateRange || { from: "2025-01-01", to: "2025-12-31" }}
      />

      {hasValue(data.eventsCreated) && <EventsCreatedSection eventsCreated={data.eventsCreated} />}

      {hasValue(data.ticketsSold) && <TicketsSoldSection ticketsSold={data.ticketsSold} />}

      {hasValue(data.totalSales) && <TotalSalesSection totalSales={data.totalSales} />}

      {hasValue(data.totalEventViews) && <EventViewsSection totalEventViews={data.totalEventViews} />}

      {hasTopAttendees && <TopAttendeesSection topRegularAttendees={data.topRegularAttendees} />}

      {hasMostPopularEvent && <MostPopularEventSection mostPopularEvent={data.mostPopularEvent} />}

      {hasValue(data.minutesSavedBookkeeping) && (
        <TimeSavedSection minutesSavedBookkeeping={data.minutesSavedBookkeeping} />
      )}

      {hasValue(data.feesSavedVsEventbrite) && <FeesSavedSection feesSavedVsEventbrite={data.feesSavedVsEventbrite} />}

      {footerSection}
    </main>
  );
}
