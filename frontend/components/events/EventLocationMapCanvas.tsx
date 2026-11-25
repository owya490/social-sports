"use client";

import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import "./EventLocationMap.css";
import {
  EVENT_LOCATION_MAP_ZOOM,
  isClutteredMapLayer,
  LOCKED_LEAFLET_MAP_OPTIONS,
  OPENFREEMAP_POSITRON_STYLE_URL,
  OPENSTREETMAP_ATTRIBUTION,
  OPENSTREETMAP_TILE_URL,
  VectorStyleLayerRef,
} from "./EventLocationMapUtils";

interface EventLocationMapCanvasProps {
  lat: number;
  lng: number;
  location: string;
}

const EVENT_LOCATION_PIN_HTML = `
  <svg width="34" height="42" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="18" cy="40.5" rx="6" ry="2.2" fill="#0a0a0a" fill-opacity="0.18" />
    <path d="M18 3C10.82 3 5 8.82 5 16C5 25.25 18 39.5 18 39.5C18 39.5 31 25.25 31 16C31 8.82 25.18 3 18 3Z" fill="#dc2626" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
    <circle cx="18" cy="15.5" r="4.5" fill="#ffffff" />
  </svg>
`;

let workerConfigured = false;

function ensureMaplibreWorkerConfigured() {
  if (workerConfigured) {
    return;
  }

  setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
  workerConfigured = true;
}

export default function EventLocationMapCanvas({ lat, lng, location }: EventLocationMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.classList.remove("event-location-map-raster-fallback");

    const map = L.map(container, {
      ...LOCKED_LEAFLET_MAP_OPTIONS,
      center: [lat, lng],
      zoom: EVENT_LOCATION_MAP_ZOOM,
    });

    map.attributionControl?.setPrefix(false);

    try {
      ensureMaplibreWorkerConfigured();
      const vectorLayer = maplibreGL({
        style: OPENFREEMAP_POSITRON_STYLE_URL,
        interactive: false,
      }).addTo(map);

      const glMap = vectorLayer.getMaplibreMap();
      const hideClutteredLayers = () => {
        const layers = glMap.getStyle()?.layers ?? [];
        for (const layer of layers) {
          if (isClutteredMapLayer(layer as VectorStyleLayerRef)) {
            glMap.setLayoutProperty(layer.id, "visibility", "none");
          }
        }
      };

      if (glMap.isStyleLoaded()) {
        hideClutteredLayers();
      } else {
        glMap.once("style.load", hideClutteredLayers);
      }
    } catch {
      container.classList.add("event-location-map-raster-fallback");
      L.tileLayer(OPENSTREETMAP_TILE_URL, {
        attribution: OPENSTREETMAP_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
    }

    const pinIcon = L.divIcon({
      className: "event-location-map-pin",
      html: EVENT_LOCATION_PIN_HTML,
      iconSize: [34, 42],
      iconAnchor: [17, 38],
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
