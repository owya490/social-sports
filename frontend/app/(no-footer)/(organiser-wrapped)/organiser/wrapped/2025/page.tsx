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
import { mockWrappedData } from "@/interfaces/WrappedTypes";

export default function WrappedPage() {
  // In production, this would come from props or a data fetch
  const data = mockWrappedData;

  return (
    <main id="wrapped-container" className="bg-white -mt-[var(--navbar-height)]">
      <BackButton />
      <ProgressIndicator />

      <HeroSection organiserName={data.organiserName} year={data.year} dateRange={data.dateRange} />

      <EventsCreatedSection eventsCreated={data.eventsCreated} />

      <TicketsSoldSection ticketsSold={data.ticketsSold} />

      <TotalSalesSection totalSales={data.totalSales} />

      <EventViewsSection totalEventViews={data.totalEventViews} />

      <TopAttendeesSection topRegularAttendees={data.topRegularAttendees} />

      <MostPopularEventSection mostPopularEvent={data.mostPopularEvent} />

      <TimeSavedSection minutesSavedBookkeeping={data.minutesSavedBookkeeping} />

      <FeesSavedSection feesSavedVsEventbrite={data.feesSavedVsEventbrite} />

      <ShareSection organiserName={data.organiserName} year={data.year} wrappedId={data.wrappedId} />
    </main>
  );
}
