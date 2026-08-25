"use client";

/**
 * THESIS: Public organiser header is a quiet white identity band — photo, name, contact, bio.
 * OWN-WORLD: Honest Clubhouse tokens, Satoshi, no colour hero; contact sits under the handle (card on desktop).
 * STORY: Visitor lands on a profile, sees who they are and how to reach them, then scrolls to events.
 * FIRST VIEWPORT: Square avatar, name, @handle, email/phone, bio.
 * FORM: Luma organiser composition inside Clubhouse light tokens, without a cover banner.
 */

import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { PublicUserData } from "@/interfaces/UserTypes";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useState } from "react";

type UserProfileHeaderProps = {
  user: PublicUserData;
};

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const fullName = `${user.firstName} ${user.surname}`.trim();
  const hasBio = Boolean(user.bio && user.bio !== "<p></p>");
  const email = user.publicContactInformation?.email?.trim();
  const mobile = user.publicContactInformation?.mobile?.trim();
  const hasContact = Boolean(email || mobile);

  const identityBlock = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-sans leading-tight">
          {fullName || "Organiser"}
        </h1>
        {user.isVerifiedOrganiser ? (
          <Image src={Tick} alt="Verified organiser" className="h-6 w-6" />
        ) : null}
      </div>

      {user.username ? (
        <p className="mt-1 text-sm text-foreground-secondary font-sans">@{user.username}</p>
      ) : null}
    </>
  );

  const mobileContactBlock = hasContact ? (
    <div className="mt-3 flex flex-col gap-1.5 md:hidden">
      {email ? (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground font-sans"
        >
          <EnvelopeIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      ) : null}
      {mobile ? (
        <a
          href={`tel:${mobile}`}
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground font-sans"
        >
          <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{mobile}</span>
        </a>
      ) : null}
    </div>
  ) : null;

  const bioBlock = (
    <div className="w-full md:mt-4 md:max-w-2xl">
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
          className="mt-2 text-xs font-semibold text-foreground font-sans hover:underline"
        >
          {isBioExpanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );

  return (
    <header className="bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <div className="flex items-start gap-4 sm:gap-5 shrink-0">
            <div className="relative size-28 md:size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
              <Image
                priority
                src={user.profilePicture}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 112px, 96px"
              />
            </div>

            <div className="min-w-0 flex-1 md:hidden">
              {identityBlock}
              {mobileContactBlock}
            </div>
          </div>

          <div className="min-w-0 flex-1 w-full">
            <div className="hidden md:block">{identityBlock}</div>
            {bioBlock}
          </div>

          {hasContact ? (
            <aside className="hidden md:block w-full md:w-64 shrink-0 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground font-sans">Contact</p>
              <div className="mt-3 space-y-2.5">
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-2 text-sm text-foreground-secondary hover:text-foreground font-sans"
                  >
                    <EnvelopeIcon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                    <span className="break-all">{email}</span>
                  </a>
                ) : null}
                {mobile ? (
                  <a
                    href={`tel:${mobile}`}
                    className="flex items-start gap-2 text-sm text-foreground-secondary hover:text-foreground font-sans"
                  >
                    <PhoneIcon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
                    <span>{mobile}</span>
                  </a>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </header>
  );
}
