"use client";

import { EventData } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { getAllEvents } from "@/services/src/events/eventsService";
import { displayPrice } from "@/utilities/priceUtils";
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon, SparklesIcon, UsersIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SportFilter = "badminton" | "volleyball";

export interface SportsSeoLandingPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  sportFilter?: SportFilter;
  heroLabel: string;
  introTitle: string;
  introCopy: string;
  benefits: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

const HIGHLIGHTED_EVENT_COUNT = 6;
const ORGANISER_COUNT = 6;
const OPERA_HOUSE_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/9/9c/Sydney_Opera_House_01.jpg";
const OPERA_HOUSE_IMAGE_SOURCE_URL = "https://commons.wikimedia.org/wiki/File:Sydney_Opera_House_01.jpg";

function eventMatchesSport(event: EventData, sport: SportFilter) {
  const searchableFields = [event.sport, event.name, event.description, ...(event.eventTags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableFields.includes(sport);
}

function sortEventsBySydneyLandingPriority(events: EventData[]) {
  return [...events].sort((a, b) => {
    const aTime = a.startDate?.toMillis?.() ?? 0;
    const bTime = b.startDate?.toMillis?.() ?? 0;

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    return (b.accessCount || 0) - (a.accessCount || 0);
  });
}

function getOrganiserName(organiser: PublicUserData) {
  const fullName = `${organiser.firstName || ""} ${organiser.surname || ""}`.trim();
  return fullName || organiser.username || "Sydney sports organiser";
}

function buildUniqueOrganisers(events: EventData[]) {
  const organisers = new Map<string, { organiserId: string; organiser: PublicUserData; eventCount: number }>();

  events.forEach((event) => {
    const organiserId = event.organiser?.userId || event.organiserId;

    if (!organiserId) {
      return;
    }

    const existing = organisers.get(organiserId);
    organisers.set(organiserId, {
      organiserId,
      organiser: event.organiser,
      eventCount: (existing?.eventCount || 0) + 1,
    });
  });

  return [...organisers.values()]
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, ORGANISER_COUNT);
}

function SydneyHeroImagePanel({
  displayedEventCount,
  organiserCount,
  loading,
}: {
  displayedEventCount: number;
  organiserCount: number;
  loading: boolean;
}) {
  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/5 text-white shadow-2xl shadow-black/30">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${OPERA_HOUSE_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.82)),linear-gradient(90deg,rgba(0,0,0,0.45),rgba(0,0,0,0.08))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/50 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] backdrop-blur-md">
        Sydney Harbour
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/25 bg-black/50 p-4 backdrop-blur-md">
            <p className="text-3xl font-bold">{loading ? "-" : displayedEventCount}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">Live events</p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-black/50 p-4 backdrop-blur-md">
            <p className="text-3xl font-bold">{loading ? "-" : organiserCount}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">Organisers</p>
          </div>
          <div className="rounded-2xl border border-white/25 bg-black/50 p-4 backdrop-blur-md">
            <p className="text-3xl font-bold">SYD</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">Sydney only</p>
          </div>
        </div>
        <a
          href={OPERA_HOUSE_IMAGE_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          Sydney Opera House image: Bernard Gagnon, Wikimedia Commons
        </a>
      </div>
    </div>
  );
}

function LoadingEventCard() {
  return (
    <div className="rounded-[2rem] border border-core-outline bg-white p-4 shadow-sm">
      <div className="aspect-[4/3] animate-pulse rounded-[1.4rem] bg-core-hover" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-core-hover" />
      <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-core-hover" />
      <div className="mt-3 h-3 w-3/5 animate-pulse rounded bg-core-hover" />
    </div>
  );
}

function EventLandingCard({ event, priority = false }: { event: EventData; priority?: boolean }) {
  const image = event.thumbnail || event.image;
  const organiserName = getOrganiserName(event.organiser);

  return (
    <Link
      href={`/event/${event.eventId}`}
      className={`group flex h-full flex-col overflow-hidden rounded-[2rem] border border-core-outline bg-white transition duration-300 hover:-translate-y-1 hover:border-black hover:shadow-2xl ${
        priority ? "md:col-span-2 lg:col-span-1" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#000,#404040)] text-white">
            <CalendarDaysIcon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-black shadow">
          {priority ? "Highlighted" : "Sydney"}
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {event.sport || "Sydney sport"}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          {timestampToEventCardDateString(event.startDate)}
        </p>
        <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-core-text">{event.name}</h3>
        <p className="mt-2 text-sm text-gray-600">{organiserName}</p>
        <div className="mt-4 space-y-2 text-sm text-core-text">
          <div className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{event.location || "Sydney"}</span>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-core-outline pt-4">
            <span className="font-semibold">${displayPrice(event.price)}</span>
            <span className="flex items-center gap-1 font-semibold">
              View event <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function OrganiserCard({
  organiserId,
  organiser,
  eventCount,
}: {
  organiserId: string;
  organiser: PublicUserData;
  eventCount: number;
}) {
  const organiserName = getOrganiserName(organiser);

  return (
    <Link
      href={`/user/${organiserId}`}
      className="group rounded-[2rem] border border-core-outline bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-black hover:shadow-xl"
    >
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 shrink-0 rounded-full border border-core-outline bg-core-hover bg-cover bg-center"
          style={{ backgroundImage: organiser.profilePicture ? `url(${organiser.profilePicture})` : undefined }}
        />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-core-text">{organiserName}</h3>
          <p className="truncate text-sm text-gray-500">{organiser.username || "Sydney organiser"}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-core-outline pt-4 text-sm">
        <span className="font-medium text-gray-600">
          {eventCount} {eventCount === 1 ? "event" : "events"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-core-text">
          Club profile <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default function SportsSeoLandingPage({
  eyebrow,
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel = "Browse all Sydney events",
  sportFilter,
  heroLabel,
  introTitle,
  introCopy,
  benefits,
  faqs,
}: SportsSeoLandingPageProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const allEvents = await getAllEvents();

        if (isMounted) {
          setEvents(allEvents);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("We couldn't load live Sydney events right now. Please try browsing all events.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const { displayedEvents, hasSportMatches } = useMemo(() => {
    const sortedEvents = sortEventsBySydneyLandingPriority(events);

    if (!sportFilter) {
      return { displayedEvents: sortedEvents, hasSportMatches: true };
    }

    const sportEvents = sortedEvents.filter((event) => eventMatchesSport(event, sportFilter));
    return {
      displayedEvents: sportEvents.length > 0 ? sportEvents : sortedEvents,
      hasSportMatches: sportEvents.length > 0,
    };
  }, [events, sportFilter]);

  const highlightedEvents = displayedEvents.slice(0, HIGHLIGHTED_EVENT_COUNT);
  const organisers = buildUniqueOrganisers(displayedEvents);
  const totalEventsLabel = displayedEvents.length === 1 ? "event" : "events";

  return (
    <div className="bg-white text-core-text">
      <section className="relative overflow-hidden bg-black px-3 py-10 text-white md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto screen-width-dashboard">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-[2rem] border border-white/20 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
              <div>
                <div className="w-fit rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                  {eyebrow}
                </div>
                <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.92] tracking-[-0.055em] md:text-7xl">
                  {title}
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-light leading-8 text-white/70 md:text-xl">{subtitle}</p>
              </div>

              <div>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#events"
                    className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black transition hover:bg-gray-200"
                  >
                    {primaryCtaLabel}
                  </Link>
                  <Link
                    href="/"
                    className="rounded-xl border border-white/25 px-6 py-3 text-center font-semibold text-white transition hover:border-white hover:bg-white/10"
                  >
                    {secondaryCtaLabel}
                  </Link>
                </div>
                <div className="mt-10 grid gap-3 border-t border-white/20 pt-6 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-bold">{loading ? "-" : displayedEvents.length}</p>
                    <p className="mt-1 text-white/60">Live {totalEventsLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-bold">{loading ? "-" : organisers.length}</p>
                    <p className="mt-1 text-white/60">Sydney clubs</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-bold">SEO</p>
                    <p className="mt-1 text-white/60">Sydney pages</p>
                  </div>
                </div>
              </div>
            </div>
            <SydneyHeroImagePanel
              displayedEventCount={displayedEvents.length}
              organiserCount={organisers.length}
              loading={loading}
            />
          </div>
          <p className="mt-4 max-w-3xl text-sm text-white/60">{heroLabel}</p>
        </div>
      </section>

      <section className="flex justify-center px-3 py-16 md:py-24">
        <div className="screen-width-dashboard">
          <div className="grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-stretch">
            <div className="rounded-[2rem] border border-core-outline bg-white p-6 md:p-8">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">
                <SparklesIcon className="h-4 w-4" /> Sydney sport guide
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] md:text-6xl">{introTitle}</h2>
            </div>
            <div className="rounded-[2rem] border border-core-outline bg-core-hover p-6 md:p-8">
              <p className="text-lg font-light leading-8 text-gray-700 md:text-xl">{introCopy}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className="rounded-2xl border border-core-outline bg-white p-5 font-medium shadow-sm"
                  >
                    <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="flex justify-center px-3 py-12">
        <div className="screen-width-dashboard">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">Highlighted events</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
                {sportFilter && hasSportMatches
                  ? `${sportFilter[0].toUpperCase()}${sportFilter.slice(1)} events in Sydney`
                  : "Upcoming sports events in Sydney"}
              </h2>
              {sportFilter && !hasSportMatches && !loading && (
                <p className="mt-3 max-w-2xl text-gray-600">
                  Dedicated {sportFilter} sessions are not listed right now, so we are showing all upcoming Sydney
                  sports events.
                </p>
              )}
            </div>
            <Link href="/" className="flex items-center gap-2 font-semibold text-core-text hover:underline">
              Open full event search <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {errorMessage && (
            <div className="mt-8 rounded-2xl border border-core-outline bg-core-hover p-5 text-gray-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <LoadingEventCard key={index} />)
              : highlightedEvents.map((event, index) => (
                  <EventLandingCard key={event.eventId || index} event={event} priority={index < 3} />
                ))}
          </div>

          {!loading && displayedEvents.length === 0 && !errorMessage && (
            <div className="mt-8 rounded-[2rem] border border-core-outline bg-core-hover p-8 text-center">
              <h3 className="text-2xl font-bold">No live events are listed yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                New Sydney sports sessions are added by local organisers. Check the main event search or create your own
                session with SPORTSHUB.
              </p>
              <div className="mt-6 flex justify-center">
                <Link href="/event/create" className="rounded-xl bg-black px-6 py-3 font-semibold text-white">
                  Create an event
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {organisers.length > 0 && (
        <section className="flex justify-center px-3 py-12">
          <div className="screen-width-dashboard">
            <div className="flex items-center gap-3">
              <UsersIcon className="h-6 w-6" />
              <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-5xl">Sydney clubs and organisers</h2>
            </div>
            <p className="mt-4 max-w-2xl text-gray-600">
              Browse clubs hosting social sport sessions and community competitions through SPORTSHUB.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {organisers.map(({ organiserId, organiser, eventCount }) => (
                <OrganiserCard
                  key={organiserId}
                  organiserId={organiserId}
                  organiser={organiser}
                  eventCount={eventCount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="flex justify-center px-3 py-12">
        <div className="screen-width-dashboard">
          <div className="rounded-[2rem] border border-black bg-black p-6 text-white md:p-10">
            <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">SEO guide</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">Common questions</h2>
              </div>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-white/20 p-5">
                    <h3 className="text-lg font-bold">{faq.question}</h3>
                    <p className="mt-2 font-light leading-7 text-white/70">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-white/20 pt-6 sm:flex-row">
              <Link href="#events" className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black">
                View highlighted events
              </Link>
              <Link
                href="/organiser/dashboard"
                className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white"
              >
                Host on SPORTSHUB
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
