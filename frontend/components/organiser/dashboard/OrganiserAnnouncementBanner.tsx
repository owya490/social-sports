"use client";

import {
  getOrganiserV2EntryHref,
  markWelcomeSeen,
  WELCOME_PATH,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { useUser } from "@/components/utility/UserContext";
import { isOrganiserHubV2BannerEnabled } from "@/services/featureFlags";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useState } from "react";

const BannerDot = () => (
  <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
    <circle r={1} cx={1} cy={1} />
  </svg>
);

export const OrganiserAnnouncementBanner = () => {
  const { user } = useUser();
  const [dismissed, setDismissed] = useState(false);
  const [v2Href, setV2Href] = useState(WELCOME_PATH);
  const showV2Banner = isOrganiserHubV2BannerEnabled(user.userId);

  useEffect(() => {
    if (!showV2Banner) return;
    setV2Href(getOrganiserV2EntryHref());
  }, [showV2Banner]);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-surface px-6 py-2.5 sm:px-3.5 sm:before:flex-1 rounded-none">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {showV2Banner ? (
          <p className="text-sm leading-6 text-foreground font-sans">
            <strong className="font-semibold">Try out our v2 organiser hub</strong>
            <BannerDot />
            A redesigned workspace for managing events, attendees, and more.{" "}
            <Link
              href={v2Href}
              className="font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80"
              onClick={() => {
                if (v2Href === WELCOME_PATH) {
                  markWelcomeSeen();
                }
              }}
            >
              Open v2 organiser hub
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </p>
        ) : (
          <p className="text-sm leading-6 text-foreground font-sans">
            <strong className="font-semibold">Ticket types are here</strong>
            <BannerDot />
            Add multiple prices, capacities, and forms in event Settings.{" "}
            <Link
              href="/blogs/features/ticket-types"
              className="font-semibold underline underline-offset-2 hover:text-foreground-secondary"
            >
              Learn more
            </Link>
          </p>
        )}
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={() => {
            setDismissed(true);
          }}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon aria-hidden="true" className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};
