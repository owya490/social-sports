"use client";

import Image from "@/components/elements/AppImage";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import Link from "next/link";
import { CSSProperties } from "react";
import styles from "./UpcomingSessionsReel.module.css";
import { LiveSession, formatSessionDay, formatSessionTime, useLiveSessions } from "./useLiveSessions";

// Each track repeats until it is wide enough to loop seamlessly on large screens.
const MIN_CARDS_PER_TRACK = 8;
const SECONDS_PER_CARD = 6;
const MIN_SESSIONS_TO_SHOW = 3;

function SessionCard({ session, hidden }: { session: LiveSession; hidden: boolean }) {
  const showSpots = !session.hideVacancy && session.capacity > 0;
  const taken = Math.max(0, session.capacity - session.vacancy);
  return (
    <Link
      href={`/event/${session.eventId}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group block w-60 shrink-0 rounded-2xl bg-white p-2.5 text-left transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        {session.image ? (
          <Image
            src={session.image}
            alt=""
            fill
            sizes="240px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-core-text">
          {getEventPriceDisplay(session.priceCents)}
        </span>
      </div>
      <div className="px-1.5 pb-1.5 pt-3">
        <p className="text-xs tabular-nums text-gray-500">
          {formatSessionDay(session.start)} · {formatSessionTime(session.start)}
        </p>
        <p className="mt-1 truncate font-semibold text-core-text">{session.name}</p>
        <p className="truncate text-sm text-gray-600">{session.hostName}</p>
        {showSpots ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <span aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
              <span
                className="block h-full rounded-full bg-gray-600"
                style={{ width: `${Math.min(100, (taken / session.capacity) * 100)}%` }}
              />
            </span>
            <span className="tabular-nums">{session.vacancy <= 0 ? "Full" : `${session.vacancy} spots left`}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function Track({ sessions, reverse }: { sessions: LiveSession[]; reverse?: boolean }) {
  const filled: LiveSession[] = [];
  while (filled.length < MIN_CARDS_PER_TRACK) filled.push(...sessions);
  const style = { "--reel-duration": `${filled.length * SECONDS_PER_CARD}s` } as CSSProperties;
  return (
    <div className={`flex w-max gap-4 py-2 pr-4 ${styles.track} ${reverse ? styles.reverse : ""}`} style={style}>
      {[...filled, ...filled].map((session, index) => (
        <SessionCard key={`${session.eventId}-${index}`} session={session} hidden={index >= sessions.length} />
      ))}
    </div>
  );
}

/** Real upcoming public sessions, as proof that clubs are running on SPORTSHUB right now. */
export default function UpcomingSessionsReel() {
  const live = useLiveSessions();
  const sessions = live.sessions;
  // A quiet or failed load hides the reel rather than showing an empty or skeleton strip.
  if (live.status !== "ready" || sessions.length < MIN_SESSIONS_TO_SHOW) return null;

  const top = sessions.filter((_, index) => index % 2 === 0);
  const bottom = sessions.filter((_, index) => index % 2 === 1);

  return (
    <section aria-labelledby="upcoming-sessions-title" className="mt-20 w-full">
      <div className="flex justify-center">
        <div className="w-full max-w-[1200px] px-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 id="upcoming-sessions-title" className="text-xl md:text-2xl font-bold text-white">
            Coming up on SPORTSHUB
          </h3>
          <Link href="/" className="text-sm text-white/80 hover:text-white hover:underline underline-offset-4">
            Browse every session →
          </Link>
        </div>
      </div>
      <div className={`mt-6 ${styles.reel}`}>
        <Track sessions={top} />
        {bottom.length > 0 ? <Track sessions={bottom} reverse /> : null}
      </div>
    </section>
  );
}
