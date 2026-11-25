"use client";

import { ArrowTopRightOnSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import {
  EventCoordinates,
  getEventDirectionsUrl,
  hasValidEventCoordinates,
} from "./EventLocationMapUtils";

const EventLocationMapCanvas = dynamic(() => import("./EventLocationMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface animate-pulse" aria-hidden="true" />,
});

interface EventLocationMapProps {
  location: string;
  locationLatLng?: EventCoordinates | null;
}

export default function EventLocationMap({ location, locationLatLng }: EventLocationMapProps) {
  if (!hasValidEventCoordinates(locationLatLng)) {
    return null;
  }

  const displayLocation = location.trim();
  const directionsUrl = getEventDirectionsUrl(displayLocation, locationLatLng);

  return (
    <section aria-labelledby="event-location-heading" className="w-full flex justify-center mt-8">
      <div className="screen-width-primary">
        <div className="w-full bg-gray-200 h-[1px] mb-8" />
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-foreground text-white flex items-center justify-center shrink-0">
                <MapPinIcon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="event-location-heading"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground-muted"
                >
                  Location
                </h2>
                {displayLocation && (
                  <p className="text-sm md:text-base font-semibold text-foreground break-words">
                    {displayLocation}
                  </p>
                )}
              </div>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-foreground bg-foreground text-white text-xs font-semibold hover:bg-white hover:text-foreground transition-colors duration-200 shrink-0"
            >
              <span>Open in Google Maps</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="relative h-[240px] sm:h-[280px] md:h-[320px] w-full isolate z-0 bg-surface">
            <EventLocationMapCanvas
              lat={locationLatLng.lat}
              lng={locationLatLng.lng}
              location={displayLocation}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
