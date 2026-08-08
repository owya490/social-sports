"use client";

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
  const email = user.publicContactInformation?.email;
  const mobile = user.publicContactInformation?.mobile;

  return (
    <header className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
        <Image
          priority
          src={user.profilePicture}
          alt=""
          width={96}
          height={96}
          className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover border border-border shrink-0"
        />

        <div className="min-w-0 flex-1">
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

          <div className="mt-4">
            <div className={`text-sm text-foreground-secondary font-sans leading-relaxed ${isBioExpanded ? "" : "line-clamp-3"}`}>
              {hasBio ? (
                <RichTextEditorContent description={user.bio} />
              ) : (
                <p>No bio yet.</p>
              )}
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
    </header>
  );
}
