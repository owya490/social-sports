import type { StyleSpecification } from "maplibre-gl";

export const OPENFREEMAP_VECTOR_SOURCE_URL = "https://tiles.openfreemap.org/planet";
export const OPENFREEMAP_GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

const SOURCE_ID = "openmaptiles";

export const DATAVIZ_LIGHT_STYLE: StyleSpecification = {
  version: 8,
  name: "SportsHub Dataviz Light",
  glyphs: OPENFREEMAP_GLYPHS_URL,
  sources: {
    [SOURCE_ID]: {
      type: "vector",
      url: OPENFREEMAP_VECTOR_SOURCE_URL,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#f5f6f7",
      },
    },
    {
      id: "landcover-green",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["grass", "wood", "farmland", "wetland"]]],
      paint: {
        "fill-color": "#e2f1de",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "park-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "park",
      paint: {
        "fill-color": "#dff0db",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "landuse-civic",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "landuse",
      filter: [
        "in",
        ["get", "class"],
        ["literal", ["hospital", "school", "university", "college", "commercial", "retail", "industrial"]],
      ],
      paint: {
        "fill-color": "#eef0f2",
        "fill-opacity": 0.7,
      },
    },
    {
      id: "landuse-green",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "landuse",
      filter: [
        "in",
        ["get", "class"],
        [
          "literal",
          ["park", "pitch", "stadium", "playground", "recreation_ground", "village_green", "golf_course", "cemetery"],
        ],
      ],
      paint: {
        "fill-color": [
          "match",
          ["get", "class"],
          ["pitch", "stadium", "playground"],
          "#d1ebc8",
          "#e1f0dc",
        ],
        "fill-opacity": 0.95,
      },
    },
    {
      id: "waterway-line",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "waterway",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#cbe4f0",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 3],
      },
    },
    {
      id: "water-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "water",
      paint: {
        "fill-color": "#cbe4f0",
      },
    },
    {
      id: "building-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-color": "#e5e7eb",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 13.8, 0.92],
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "building",
      minzoom: 13.5,
      paint: {
        "line-color": "#d1d5db",
        "line-width": 0.75,
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 13.5, 0, 14.2, 0.9],
      },
    },
    {
      id: "boundary-subtle",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "boundary",
      filter: ["all", ["!=", ["get", "maritime"], 1], ["<=", ["get", "admin_level"], 8]],
      paint: {
        "line-color": "#d8c5c5",
        "line-width": 0.9,
        "line-dasharray": [4, 2],
        "line-opacity": 0.65,
      },
    },
    {
      id: "rail-line",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["rail", "transit"]]],
      paint: {
        "line-color": "#d3d7de",
        "line-width": 1.1,
        "line-dasharray": [4, 3],
      },
    },
    {
      id: "path-line",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      minzoom: 14,
      filter: ["in", ["get", "class"], ["literal", ["path", "track"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#e2e5ea",
        "line-width": 0.9,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "road-minor-casing",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["service", "minor", "tertiary"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#dcdfe5",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 14, 4, 16, 7.5],
      },
    },
    {
      id: "road-major-casing",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "primary", "trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#cfd4dd",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 14, 6.5, 16, 11],
      },
    },
    {
      id: "road-minor-fill",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["service", "minor", "tertiary"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 14, 2.5, 16, 5.5],
      },
    },
    {
      id: "road-major-fill",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "primary", "trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.8, 14, 4.5, 16, 8.5],
      },
    },
    {
      id: "road-label",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "transportation_name",
      minzoom: 14,
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor"]]],
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 360,
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 16, 11.5],
        "text-max-angle": 30,
      },
      paint: {
        "text-color": "#6b7280",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    },
    {
      id: "water-label",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "water_name",
      minzoom: 13,
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Italic"],
        "text-size": 10.5,
      },
      paint: {
        "text-color": "#64899e",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "place-label",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "suburb", "quarter", "neighbourhood"]]],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["match", ["get", "class"], "city", 14, "town", 13, 11.5],
        "text-max-width": 8,
        "text-padding": 14,
      },
      paint: {
        "text-color": "#374151",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
      },
    },
  ],
};
