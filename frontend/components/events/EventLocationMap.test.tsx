import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";
import { renderToStaticMarkup } from "react-dom/server";
import EventLocationMap from "./EventLocationMap";
import {
  hasValidEventCoordinates,
  isClutteredMapLayer,
  LOCKED_LEAFLET_MAP_OPTIONS,
} from "./EventLocationMapUtils";

describe("EventLocationMapUtils", () => {
  it("accepts valid coordinates and rejects invalid or sentinel coordinates", () => {
    expect(hasValidEventCoordinates({ lat: -33.8688, lng: 151.2093 })).toBe(true);
    expect(hasValidEventCoordinates({ lat: INVALID_LAT, lng: INVALID_LNG })).toBe(false);
    expect(hasValidEventCoordinates(null)).toBe(false);
    expect(hasValidEventCoordinates(undefined)).toBe(false);
    expect(hasValidEventCoordinates({ lat: Number.NaN, lng: 151.2093 })).toBe(false);
    expect(hasValidEventCoordinates({ lat: 95, lng: 151.2093 })).toBe(false);
    expect(hasValidEventCoordinates({ lat: -33.8688, lng: 185 })).toBe(false);
  });

  it("identifies POI clutter layers while preserving roads, parks, water, and place labels", () => {
    expect(isClutteredMapLayer({ id: "poi_r20", "source-layer": "poi" })).toBe(true);
    expect(isClutteredMapLayer({ id: "poi-level-1" })).toBe(true);
    expect(isClutteredMapLayer({ id: "custom_shop_icons", "source-layer": "poi" })).toBe(true);
    expect(isClutteredMapLayer({ id: "road_primary", "source-layer": "transportation" })).toBe(false);
    expect(isClutteredMapLayer({ id: "park", "source-layer": "park" })).toBe(false);
    expect(isClutteredMapLayer({ id: "water", "source-layer": "water" })).toBe(false);
  });

  it("disables all zoom and pan interactions while keeping attribution enabled", () => {
    expect(LOCKED_LEAFLET_MAP_OPTIONS).toEqual({
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: true,
    });
  });
});

describe("EventLocationMap", () => {
  it("renders a flat map container without card chrome or a Google Maps button", () => {
    const markup = renderToStaticMarkup(
      <EventLocationMap
        location="Perry Park Recreation Centre, Alexandria"
        locationLatLng={{ lat: -33.9082, lng: 151.2012 }}
      />
    );

    expect(markup).toContain("rounded-xl");
    expect(markup).not.toContain("Open in Google Maps");
    expect(markup).not.toContain("shadow-sm");
  });

  it("renders nothing when coordinates are invalid", () => {
    const markup = renderToStaticMarkup(
      <EventLocationMap
        location="Unknown Location"
        locationLatLng={{ lat: INVALID_LAT, lng: INVALID_LNG }}
      />
    );

    expect(markup).toBe("");
  });
});
