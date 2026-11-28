"use client";

import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { DATAVIZ_LIGHT_STYLE } from "./datavizStyle";
import "./EventLocationMap.css";
import {
  EVENT_LOCATION_MAP_ZOOM,
  LOCKED_MAPLIBRE_OPTIONS,
  toMapLibreLngLat,
} from "./locationMapUtils";

interface EventLocationMapCanvasProps {
  lat: number;
  lng: number;
  location: string;
}

const EVENT_LOCATION_PIN_SVG = `
  <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M13 1C6.373 1 1 6.373 1 13c0 8.5 10.6 18.8 11.35 19.5a.95.95 0 0 0 1.3 0C14.4 31.8 25 21.5 25 13 25 6.373 19.627 1 13 1Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>
    <circle cx="13" cy="12.5" r="4.5" fill="#FFFFFF"/>
  </svg>
`;

let workerConfigured = false;

function ensureMapLibreWorkerConfigured() {
  if (workerConfigured) {
    return;
  }

  setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
  workerConfigured = true;
}

function createPinElement(): HTMLDivElement {
  const element = document.createElement("div");
  element.className = "event-location-map-pin";
  element.innerHTML = EVENT_LOCATION_PIN_SVG;
  return element;
}

export default function EventLocationMapCanvas({ lat, lng, location }: EventLocationMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const center = toMapLibreLngLat({ lat, lng });
    let map: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      ensureMapLibreWorkerConfigured();

      map = new MapLibreMap({
        ...LOCKED_MAPLIBRE_OPTIONS,
        container,
        style: DATAVIZ_LIGHT_STYLE,
        center,
        zoom: EVENT_LOCATION_MAP_ZOOM,
      });

      map.addControl(new AttributionControl({ compact: false }), "bottom-right");

      new Marker({
        element: createPinElement(),
        anchor: "bottom",
        draggable: false,
      })
        .setLngLat(center)
        .addTo(map);

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          map?.resize();
          map?.jumpTo({ center, zoom: EVENT_LOCATION_MAP_ZOOM });
        });
        resizeObserver.observe(container);
      }
    } catch {
      // Browser lacks WebGL support; leave clean neutral container without crashing the page.
    }

    return () => {
      resizeObserver?.disconnect();
      map?.remove();
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
