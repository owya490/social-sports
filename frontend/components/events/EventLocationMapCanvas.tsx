"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import "./EventLocationMap.css";
import {
  ESRI_LIGHT_GRAY_ATTRIBUTION,
  ESRI_LIGHT_GRAY_BASE_TILE_URL,
  ESRI_LIGHT_GRAY_MAX_ZOOM,
  ESRI_LIGHT_GRAY_REFERENCE_TILE_URL,
  EVENT_LOCATION_MAP_ZOOM,
  LOCKED_LEAFLET_MAP_OPTIONS,
} from "./EventLocationMapUtils";

interface EventLocationMapCanvasProps {
  lat: number;
  lng: number;
  location: string;
}

const EVENT_LOCATION_PIN_HTML = `
  <div class="event-location-map-pin-icon">
    <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M13 1C6.373 1 1 6.373 1 13c0 8.5 10.6 18.8 11.35 19.5a.95.95 0 0 0 1.3 0C14.4 31.8 25 21.5 25 13 25 6.373 19.627 1 13 1Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="13" cy="12.5" r="4.5" fill="#FFFFFF"/>
    </svg>
  </div>
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

    map.attributionControl?.setPrefix(false);

    L.tileLayer(ESRI_LIGHT_GRAY_BASE_TILE_URL, {
      attribution: ESRI_LIGHT_GRAY_ATTRIBUTION,
      maxZoom: ESRI_LIGHT_GRAY_MAX_ZOOM,
    }).addTo(map);

    L.tileLayer(ESRI_LIGHT_GRAY_REFERENCE_TILE_URL, {
      maxZoom: ESRI_LIGHT_GRAY_MAX_ZOOM,
      pane: "overlayPane",
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "event-location-map-pin",
      html: EVENT_LOCATION_PIN_HTML,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
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
