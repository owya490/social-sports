"use client";

import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";

type GalleryHeaderProps = {
  thumbnailCount: number;
  imageCount: number;
  loading: boolean;
};

export function GalleryHeader({ thumbnailCount, imageCount, loading }: GalleryHeaderProps) {
  const total = thumbnailCount + imageCount;
  const subtitle = loading
    ? "Loading your images…"
    : total === 0
      ? "Upload thumbnails and event photos with the right crop"
      : `${thumbnailCount} thumbnail${thumbnailCount === 1 ? "" : "s"} · ${imageCount} event image${
          imageCount === 1 ? "" : "s"
        }`;

  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4">
      <OrganiserBreadcrumbs />
      <div className="min-w-0">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
          Image gallery
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
      </div>
    </header>
  );
}
