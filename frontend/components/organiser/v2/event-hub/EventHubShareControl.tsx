"use client";

import { EventId } from "@/interfaces/EventTypes";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import {
  EnvelopeIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

/**
 * Comp A footer share row — circular channel icons, no center modal.
 */

type EventHubShareControlProps = {
  eventId: EventId;
};

export function EventHubShareControl({ eventId }: EventHubShareControlProps) {
  const [eventURL, setEventURL] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEventURL(getUrlWithCurrentHostname(`/event/${eventId}`));
  }, [eventId]);

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(eventURL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const encoded = encodeURIComponent(eventURL);
  const encodedTitle = encodeURIComponent("Check out this event on SPORTSHUB");

  const channels = [
    {
      id: "link",
      label: copied ? "Copied" : "Copy link",
      onClick: copyURL,
      href: undefined as string | undefined,
      icon: <LinkIcon className="h-4 w-4" aria-hidden />,
    },
    {
      id: "facebook",
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: <FacebookGlyph />,
    },
    {
      id: "x",
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      icon: <XGlyph />,
    },
    {
      id: "email",
      label: "Share by email",
      href: `mailto:?subject=${encodedTitle}&body=${encoded}`,
      icon: <EnvelopeIcon className="h-4 w-4" aria-hidden />,
    },
  ];

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Share event">
      <span className="text-xs text-foreground-muted font-sans mr-0.5">Share</span>
      {channels.map((channel) => {
        const className =
          "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

        if (channel.href) {
          return (
            <a
              key={channel.id}
              href={channel.href}
              target={channel.id === "email" ? undefined : "_blank"}
              rel={channel.id === "email" ? undefined : "noopener noreferrer"}
              aria-label={channel.label}
              className={className}
            >
              {channel.icon}
            </a>
          );
        }

        return (
          <button
            key={channel.id}
            type="button"
            onClick={channel.onClick}
            aria-label={channel.label}
            className={className}
          >
            {channel.icon}
          </button>
        );
      })}
    </div>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M14 8h2.5V5.5H14c-1.9 0-3.5 1.6-3.5 3.5V11H8v2.5h2.5V19H13v-5.5h2.3L16 11h-3V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
