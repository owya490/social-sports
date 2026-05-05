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

function SydneyOperaHouseMark() {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-[2rem] border border-black bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
      <div className="absolute left-6 top-6 rounded-full border border-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
        Sydney
      </div>
      <svg
        className="absolute bottom-14 left-1/2 w-[120%] max-w-[720px] -translate-x-1/2"
        viewBox="0 0 800 360"
        fill="none"
        role="img"
        aria-label="Minimal Sydney Opera House line artwork"
      >
        <path
          d="M98 272C176 239 236 177 274 86C311 157 323 220 310 272"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M250 274C337 221 402 146 446 48C492 150 504 226 481 274"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M433 274C511 231 570 167 610 84C653 162 665 225 646 274"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path d="M68 278H720" stroke="white" strokeWidth="14" strokeLinecap="round" />
        <path d="M34 322C160 302 244 302 370 322C502 343 610 337 766 306" stroke="white" strokeWidth="10" />
      </svg>
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-6">
        <p className="max-w-xs text-sm text-white/70">
          A clean black-and-white guide to social sport sessions, clubs and community events across Sydney.
        </p>
        <div className="hidden rounded-2xl border border-white/30 px-5 py-4 text-right md:block">
          <p className="text-4xl font-bold">AU</p>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">SPORTSHUB</p>
        </div>
      </div>
    </div>
  );
}

function LoadingEventCard() {
  return (
    <div className="rounded-3xl border border-core-outline bg-white p-4">
      <div className="aspect-[4/3] animate-pulse rounded-2xl bg-core-hover" />
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
      className={`group flex h-full flex-col rounded-3xl border border-core-outline bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-black hover:shadow-xl ${
        priority ? "md:p-5" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
        {image ? (
          <div
            className="absolute inset-0 bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
            style={{ backgroundImage: `url(${image})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#000,#404040)] text-white">
            <CalendarDaysIcon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
        <div className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
          {event.sport || "Sydney sport"}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-4">
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
          <div className="flex items-center justify-between border-t border-core-outline pt-3">
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
      className="group rounded-3xl border border-core-outline bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-black hover:shadow-xl"
    >
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 shrink-0 rounded-full border border-core-outline bg-core-hover bg-cover bg-center grayscale"
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
      <section className="flex justify-center px-3 py-10 md:py-16">
        <div className="screen-width-dashboard">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div className="flex flex-col justify-center rounded-[2rem] border border-core-outline bg-white p-6 md:p-10">
              <div className="w-fit rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                {eyebrow}
              </div>
              <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] md:text-7xl">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-light leading-8 text-gray-600 md:text-xl">{subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#events"
                  className="rounded-xl bg-black px-6 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-core-outline px-6 py-3 text-center font-semibold text-black transition hover:border-black hover:bg-core-hover"
                >
                  {secondaryCtaLabel}
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-core-outline pt-6 text-sm">
                <div>
                  <p className="text-3xl font-bold">{loading ? "-" : displayedEvents.length}</p>
                  <p className="mt-1 text-gray-500">Live {totalEventsLabel}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{loading ? "-" : organisers.length}</p>
                  <p className="mt-1 text-gray-500">Clubs</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">SYD</p>
                  <p className="mt-1 text-gray-500">Location</p>
                </div>
              </div>
            </div>
            <SydneyOperaHouseMark />
          </div>
          <p className="mt-4 text-sm text-gray-500">{heroLabel}</p>
        </div>
      </section>

      <section className="flex justify-center px-3 py-10">
        <div className="screen-width-dashboard">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">
                <SparklesIcon className="h-4 w-4" /> Sydney sport guide
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.02em] md:text-5xl">{introTitle}</h2>
            </div>
            <div className="rounded-[2rem] border border-core-outline bg-core-hover p-6 md:p-8">
              <p className="text-lg font-light leading-8 text-gray-700">{introCopy}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="rounded-2xl border border-core-outline bg-white p-4 font-medium">
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
