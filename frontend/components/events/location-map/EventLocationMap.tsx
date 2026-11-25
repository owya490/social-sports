"use client";

import dynamic from "next/dynamic";
import { EventCoordinates, hasValidEventCoordinates } from "./locationMapUtils";

const EventLocationMapCanvas = dynamic(() => import("./EventLocationMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#f5f6f7] animate-pulse" aria-hidden="true" />,
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

  return (
    <div className="w-full flex justify-center mt-8">
      <div className="screen-width-primary">
        <div className="relative h-[220px] sm:h-[260px] md:h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 isolate z-0 bg-[#f5f6f7]">
          <EventLocationMapCanvas
            lat={locationLatLng.lat}
            lng={locationLatLng.lng}
            location={displayLocation}
          />
        </div>
      </div>
    </div>
  );
}
