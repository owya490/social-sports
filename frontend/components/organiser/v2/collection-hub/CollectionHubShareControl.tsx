"use client";

import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { EnvelopeIcon, LinkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

/**
 * Comp A footer share row — circular channel icons, no center modal.
 */

type CollectionHubShareControlProps = {
  collectionId: EventCollectionId;
};

export function CollectionHubShareControl({ collectionId }: CollectionHubShareControlProps) {
  const [collectionURL, setCollectionURL] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCollectionURL(getUrlWithCurrentHostname(`/event-collection/${collectionId}`));
  }, [collectionId]);

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(collectionURL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const encoded = encodeURIComponent(collectionURL);
  const encodedTitle = encodeURIComponent("Check out this event collection on SPORTSHUB");

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
    <div className="flex items-center gap-2" role="group" aria-label="Share collection">
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
  // Classic Facebook square mark (filled square with “f” cut-out).
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M20.9 2H3.1A1.1 1.1 0 0 0 2 3.1v17.8A1.1 1.1 0 0 0 3.1 22h9.58V14.25h-2.6v-3h2.6V9.2c0-2.6 1.58-4.02 3.89-4.02 1.11 0 2.06.08 2.34.12v2.7h-1.6c-1.26 0-1.5.6-1.5 1.48v1.77h3l-.39 3h-2.61V22h5.1A1.1 1.1 0 0 0 22 20.9V3.1A1.1 1.1 0 0 0 20.9 2z" />
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
