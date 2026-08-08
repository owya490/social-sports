"use client";

import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

type EntityRowThumbnailProps = {
  src?: string;
  className?: string;
};

/**
 * Square list-row cover: skeleton while the remote image resolves, then a short fade-in.
 */
export function EntityRowThumbnail({ src, className = "" }: EntityRowThumbnailProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!src) return;

    let cancelled = false;
    const img = new window.Image();
    const markLoaded = () => {
      if (!cancelled) setLoaded(true);
    };

    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = src;
    if (img.complete) markLoaded();

    return () => {
      cancelled = true;
    };
  }, [src]);

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
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: loaded ? `url(${src})` : undefined }}
          role="img"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
