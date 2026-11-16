"use client";

import NextImage, { ImageProps } from "next/image";
import { useState } from "react";

const OPTIMISED_REMOTE_HOSTS = new Set(["firebasestorage.googleapis.com"]);

/**
 * Only our own assets go through Vercel image optimisation. Other remote hosts (social login profile photos,
 * hotlinked third-party images) are not allow-listed in next.config.js and must keep loading directly.
 */
export function shouldOptimiseImage(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") {
    return true;
  }
  if (src.startsWith("/") && !src.startsWith("//")) {
    return true;
  }
  try {
    return OPTIMISED_REMOTE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

function srcKey(src: ImageProps["src"]): string {
  if (typeof src === "string") {
    return src;
  }
  return "default" in src ? src.default.src : src.src;
}

/**
 * Drop-in replacement for next/image. If the optimiser fails for an image (for example once the Vercel Hobby
 * image quota is exhausted and it returns 402), it falls back to loading the original URL, matching the
 * behaviour before optimisation was enabled.
 */
export default function AppImage({ unoptimized, onError, sizes, ...props }: ImageProps) {
  const key = srcKey(props.src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const bypassOptimiser = Boolean(unoptimized) || failedSrc === key || !shouldOptimiseImage(props.src);

  // width={0} with CSS sizing is a common pattern here; without `sizes` Next would request a 32px variant.
  const isCssSized = !props.fill && Number(props.width) === 0;
  const resolvedSizes = sizes ?? (isCssSized ? "100vw" : undefined);

  return (
    <NextImage
      {...props}
      sizes={resolvedSizes}
      unoptimized={bypassOptimiser}
      onError={(event) => {
        if (!bypassOptimiser) {
          setFailedSrc(key);
        }
        onError?.(event);
      }}
    />
  );
}
