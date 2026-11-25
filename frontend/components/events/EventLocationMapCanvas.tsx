"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import "./EventLocationMap.css";
import {
  EVENT_LOCATION_MAP_ZOOM,
  LOCKED_LEAFLET_MAP_OPTIONS,
  OPENSTREETMAP_ATTRIBUTION,
  OPENSTREETMAP_TILE_URL,
} from "./EventLocationMapUtils";

interface EventLocationMapCanvasProps {
  lat: number;
  lng: number;
  location: string;
}

const EVENT_LOCATION_PIN_HTML = `
  <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="18" cy="40.5" rx="7" ry="2.5" fill="#0a0a0a" fill-opacity="0.28" />
    <path d="M18 3C10.82 3 5 8.82 5 16C5 25.25 18 39.5 18 39.5C18 39.5 31 25.25 31 16C31 8.82 25.18 3 18 3Z" fill="#0a0a0a" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
    <circle cx="18" cy="15.5" r="4.5" fill="#ffffff" />
  </svg>
`;

export default function EventLocationMapCanvas({ lat, lng, location }: EventLocationMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const map = L.map(container, {
      ...LOCKED_LEAFLET_MAP_OPTIONS,
      center: [lat, lng],
      zoom: EVENT_LOCATION_MAP_ZOOM,
    });

    L.tileLayer(OPENSTREETMAP_TILE_URL, {
      attribution: OPENSTREETMAP_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "event-location-map-pin",
      html: EVENT_LOCATION_PIN_HTML,
      iconSize: [36, 44],
      iconAnchor: [18, 40],
    });

    L.marker([lat, lng], {
      icon: pinIcon,
      interactive: false,
      keyboard: false,
    }).addTo(map);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize({ pan: false });
        map.setView([lat, lng], EVENT_LOCATION_MAP_ZOOM, { animate: false });
      });
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div className="event-location-map h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label={location ? `Map showing ${location}` : "Map showing event location"}
      />
    </div>
  );
}
