import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";
import { renderToStaticMarkup } from "react-dom/server";
import { DATAVIZ_LIGHT_STYLE, OPENFREEMAP_GLYPHS_URL, OPENFREEMAP_VECTOR_SOURCE_URL } from "./datavizStyle";
import EventLocationMap from "./EventLocationMap";
import {
  getGoogleMapsLocationUrl,
  hasValidEventCoordinates,
  LOCKED_MAPLIBRE_OPTIONS,
  toMapLibreLngLat,
} from "./locationMapUtils";

describe("locationMapUtils", () => {
  it("accepts valid coordinates and rejects invalid or sentinel coordinates", () => {
    expect(hasValidEventCoordinates({ lat: -33.8688, lng: 151.2093 })).toBe(true);
    expect(hasValidEventCoordinates({ lat: INVALID_LAT, lng: INVALID_LNG })).toBe(false);
    expect(hasValidEventCoordinates(null)).toBe(false);
    expect(hasValidEventCoordinates(undefined)).toBe(false);
    expect(hasValidEventCoordinates({ lat: Number.NaN, lng: 151.2093 })).toBe(false);
    expect(hasValidEventCoordinates({ lat: 95, lng: 151.2093 })).toBe(false);
    expect(hasValidEventCoordinates({ lat: -33.8688, lng: 185 })).toBe(false);
  });

  it("converts lat/lng coordinates to MapLibre [lng, lat] order", () => {
    expect(toMapLibreLngLat({ lat: -33.8474, lng: 151.0631 })).toEqual([151.0631, -33.8474]);
  });

  it("builds a Google Maps link from the location text or falls back to coordinates", () => {
    expect(getGoogleMapsLocationUrl("Sydney Olympic Park", { lat: -33.8474, lng: 151.0631 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Sydney%20Olympic%20Park"
    );
    expect(getGoogleMapsLocationUrl("  ", { lat: -33.8474, lng: 151.0631 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=-33.8474%2C151.0631"
    );
  });

  it("disables all zoom, pan, rotate, and keyboard interactions", () => {
    expect(LOCKED_MAPLIBRE_OPTIONS).toEqual({
      interactive: false,
      attributionControl: false,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      touchZoomRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      bearing: 0,
      pitch: 0,
    });
  });
});

describe("DATAVIZ_LIGHT_STYLE", () => {
  it("uses OpenFreeMap vector tiles and glyphs with no POI or housenumber layers", () => {
    expect(DATAVIZ_LIGHT_STYLE.glyphs).toBe(OPENFREEMAP_GLYPHS_URL);
    expect(DATAVIZ_LIGHT_STYLE.sources.openmaptiles).toEqual({
      type: "vector",
      url: OPENFREEMAP_VECTOR_SOURCE_URL,
    });

    const sourceLayers = DATAVIZ_LIGHT_STYLE.layers
      .map((layer) => ("source-layer" in layer ? layer["source-layer"] : undefined))
      .filter((layer): layer is string => Boolean(layer));

    expect(sourceLayers).not.toContain("poi");
    expect(sourceLayers).not.toContain("housenumber");
    expect(sourceLayers).toContain("building");
    expect(sourceLayers).toContain("park");
    expect(sourceLayers).toContain("water");
    expect(sourceLayers).toContain("transportation");
  });

  it("includes flat building fill and outline layers without 3D extrusions", () => {
    const buildingLayers = DATAVIZ_LIGHT_STYLE.layers.filter(
      (layer) => "source-layer" in layer && layer["source-layer"] === "building"
    );

    expect(buildingLayers.map((layer) => layer.type)).toEqual(["fill", "line"]);
  });
});

describe("EventLocationMap", () => {
  it("renders a flat clickable map linking to Google Maps in a new tab", () => {
    const markup = renderToStaticMarkup(
      <EventLocationMap
        location="Sydney Olympic Park"
        locationLatLng={{ lat: -33.8474, lng: 151.0631 }}
      />
    );

    expect(markup).toContain("rounded-xl");
    expect(markup).toContain("cursor-pointer");
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=Sydney%20Olympic%20Park"');
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
