"use client";

import dynamic from "next/dynamic";
import {
  EventCoordinates,
  getGoogleMapsLocationUrl,
  hasValidEventCoordinates,
} from "./locationMapUtils";

const EventLocationMapCanvas = dynamic(() => import("./EventLocationMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#f1f3f4] animate-pulse" aria-hidden="true" />,
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
  const googleMapsUrl = getGoogleMapsLocationUrl(displayLocation, locationLatLng);

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="screen-width-primary">
        <div className="relative h-[220px] sm:h-[260px] md:h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 isolate z-0 bg-[#f1f3f4]">
          <EventLocationMapCanvas
            lat={locationLatLng.lat}
            lng={locationLatLng.lng}
            location={displayLocation}
          />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              displayLocation ? `Open ${displayLocation} in Google Maps` : "Open event location in Google Maps"
            }
            className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground"
          />
        </div>
      </div>
    </div>
  );
}
