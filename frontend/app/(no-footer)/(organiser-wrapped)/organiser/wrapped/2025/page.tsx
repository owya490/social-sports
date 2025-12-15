"use client";

import { BackButton } from "@/components/organiser/wrapped/BackButton";
import { ProgressIndicator } from "@/components/organiser/wrapped/ProgressIndicator";
import { EventsCreatedSection } from "@/components/organiser/wrapped/sections/EventsCreatedSection";
import { EventViewsSection } from "@/components/organiser/wrapped/sections/EventViewsSection";
import { FeesSavedSection } from "@/components/organiser/wrapped/sections/FeesSavedSection";
import { HeroSection } from "@/components/organiser/wrapped/sections/HeroSection";
import { MostPopularEventSection } from "@/components/organiser/wrapped/sections/MostPopularEventSection";
import { ShareSection } from "@/components/organiser/wrapped/sections/ShareSection";
import { TicketsSoldSection } from "@/components/organiser/wrapped/sections/TicketsSoldSection";
import { TimeSavedSection } from "@/components/organiser/wrapped/sections/TimeSavedSection";
import { TopAttendeesSection } from "@/components/organiser/wrapped/sections/TopAttendeesSection";
import { TotalSalesSection } from "@/components/organiser/wrapped/sections/TotalSalesSection";
import { WrappedLoading } from "@/components/organiser/wrapped/WrappedLoading";
import { useUser } from "@/components/utility/UserContext";
import { SportshubWrapped } from "@/interfaces/WrappedTypes";
import { Logger } from "@/observability/logger";
import { getWrappedData } from "@/services/src/wrapped/wrappedServices";
import { useEffect, useState } from "react";

const WRAPPED_YEAR = 2025;
const MIN_LOADING_TIME_MS = 10000;

const wrappedPageLogger = new Logger("wrappedPageLogger");

export default function WrappedPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SportshubWrapped | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWrappedData = async () => {
      if (!user.userId) {
        return;
      }

      const startTime = Date.now();

      try {
        wrappedPageLogger.info(`Fetching wrapped data for user: ${user.userId}`);
        const wrappedData = await getWrappedData(user.userId, WRAPPED_YEAR);
        setData(wrappedData);
        wrappedPageLogger.info(`Successfully fetched wrapped data for user: ${user.userId}`);
      } catch (err) {
        wrappedPageLogger.error(`Failed to fetch wrapped data: ${err}`);
        setError("Failed to load your wrapped data. Please try again later.");
      } finally {
        // Ensure minimum loading time of 10 seconds for the animation
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsed);

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    fetchWrappedData();
  }, []);

  if (isLoading || !data) {
    return <WrappedLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center px-6 -mt-[var(--navbar-height)]">
        <p className="text-white text-xl text-center">{error}</p>
      </div>
    );
  }

  // Helper to check if a value is present and non-zero
  const hasValue = (value: number | null | undefined): boolean => {
    return value !== null && value !== undefined && value > 0;
  };

  const hasTopAttendees = data.topRegularAttendees && data.topRegularAttendees.length > 0;
  const hasMostPopularEvent = data.mostPopularEvent && data.mostPopularEvent.eventId;

  return (
    <main id="wrapped-container" className="bg-white -mt-[var(--navbar-height)]">
      <BackButton />
      <ProgressIndicator />

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

      <ShareSection
        organiserName={data.organiserName || "Organiser"}
        year={data.year || WRAPPED_YEAR}
        wrappedId={data.wrappedId || ""}
      />
    </main>
  );
}
