"use client";

/**
 * THESIS: Public organiser header mirrors Luma’s hero → overlapping avatar → white identity band.
 * OWN-WORLD: Flat hero from profile-picture dominant colour (no cover image); Clubhouse white band + Satoshi.
 * STORY: Visitor lands on a profile, reads who they are, then scrolls into events on the grey stage.
 * FIRST VIEWPORT: Colour hero, overlapping square avatar, name / @handle / contact / bio on white.
 * FORM: Luma organiser composition inside Honest Clubhouse tokens.
 */

import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { useImageDominantColor } from "@/components/users/profile/useImageDominantColor";
import { PublicUserData } from "@/interfaces/UserTypes";
import { getCurrentTimezoneShort } from "@/services/src/datetimeUtils";
import { ClockIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

type UserProfileHeaderProps = {
  user: PublicUserData;
};

function formatLocalTimeLabel(): string {
  const now = new Date();
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `Times in ${getCurrentTimezoneShort()} — ${time}`;
}

function subscribeLocalTime(onStoreChange: () => void): () => void {
  const id = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(id);
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const heroColor = useImageDominantColor(user.profilePicture);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const localTimeLabel = useSyncExternalStore(subscribeLocalTime, formatLocalTimeLabel, () => "");
  const fullName = `${user.firstName} ${user.surname}`.trim();
  const hasBio = Boolean(user.bio && user.bio !== "<p></p>");
  const email = user.publicContactInformation?.email;
  const mobile = user.publicContactInformation?.mobile;

  return (
    <header className="bg-background">
      {/* Flat colour hero — stand-in for a cover image, tinted from the profile picture */}
      <div className="relative h-28 sm:h-36 w-full" style={{ backgroundColor: heroColor }} aria-hidden />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-10 sm:-mt-12 pb-6 sm:pb-8">
          <div className="flex items-end justify-between gap-3">
            <div className="relative h-20 w-20 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl border-[3px] sm:border-4 border-background bg-surface-muted shadow-sm">
              <Image
                priority
                src={user.profilePicture}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-sans leading-tight">
                {fullName || "Organiser"}
              </h1>
              {user.isVerifiedOrganiser ? (
                <Image src={Tick} alt="Verified organiser" className="h-6 w-6" />
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-secondary font-sans">
              {user.username ? <span>@{user.username}</span> : null}
              {localTimeLabel ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {localTimeLabel}
                </span>
              ) : null}
            </div>

            {(email || mobile) && (
              <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 text-xs text-foreground-secondary hover:text-foreground font-sans"
                  >
                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{email}</span>
                  </a>
                ) : null}
                {mobile ? (
                  <a
                    href={`tel:${mobile}`}
                    className="inline-flex items-center gap-2 text-xs text-foreground-secondary hover:text-foreground font-sans"
                  >
                    <PhoneIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{mobile}</span>
                  </a>
                ) : null}
              </div>
            )}

            <div className="mt-4 max-w-2xl">
              <div
                className={`text-sm text-foreground-secondary font-sans leading-relaxed ${
                  isBioExpanded ? "" : "line-clamp-3"
                }`}
              >
                {hasBio ? <RichTextEditorContent description={user.bio} /> : <p>No bio yet.</p>}
              </div>
              {hasBio && user.bio.length > 160 ? (
                <button
                  type="button"
                  onClick={() => setIsBioExpanded((v) => !v)}
                  className="mt-2 text-xs font-semibold text-foreground font-sans hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-sm"
                >
                  {isBioExpanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
