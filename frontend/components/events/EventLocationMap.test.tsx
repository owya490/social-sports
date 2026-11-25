import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";
import { renderToStaticMarkup } from "react-dom/server";
import EventLocationMap from "./EventLocationMap";
import {
  getEventDirectionsUrl,
  hasValidEventCoordinates,
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

  it("builds a Google Maps link from the address or falls back to coordinates", () => {
    expect(getEventDirectionsUrl("Sydney Olympic Park", { lat: -33.8474, lng: 151.0631 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Sydney%20Olympic%20Park"
    );
    expect(getEventDirectionsUrl("   ", { lat: -33.8474, lng: 151.0631 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=-33.8474%2C151.0631"
    );
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
  it("renders the location card and Google Maps link when coordinates are valid", () => {
    const markup = renderToStaticMarkup(
      <EventLocationMap
        location="Perry Park Recreation Centre, Alexandria"
        locationLatLng={{ lat: -33.9082, lng: 151.2012 }}
      />
    );

    expect(markup).toContain("Location");
    expect(markup).toContain("Perry Park Recreation Centre, Alexandria");
    expect(markup).toContain("Open in Google Maps");
    expect(markup).toContain(
      'href="https://www.google.com/maps/search/?api=1&amp;query=Perry%20Park%20Recreation%20Centre%2C%20Alexandria"'
    );
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
