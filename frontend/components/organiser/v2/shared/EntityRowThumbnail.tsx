"use client";

import { useState } from "react";
import Skeleton from "react-loading-skeleton";

type EntityRowThumbnailProps = {
  src?: string;
  className?: string;
};

/**
 * Square list-row cover: skeleton while the remote image resolves, then a short fade-in.
 * Uses native lazy-loading so long event lists do not download every Storage image at once.
 */
export function EntityRowThumbnail({ src, className = "" }: EntityRowThumbnailProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = Boolean(src) && loadedSrc === src;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted ${className}`}
    >
      {src && !loaded ? (
        <Skeleton
          height="100%"
          width="100%"
          className="!absolute inset-0 !block !rounded-lg !leading-none"
          containerClassName="absolute inset-0 block h-full w-full"
        />
      ) : null}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setLoadedSrc(src)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
