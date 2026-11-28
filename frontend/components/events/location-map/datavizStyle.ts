import type { StyleSpecification } from "maplibre-gl";

export const OPENFREEMAP_VECTOR_SOURCE_URL = "https://tiles.openfreemap.org/planet";
export const OPENFREEMAP_GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

const SOURCE_ID = "openmaptiles";

export const DATAVIZ_LIGHT_STYLE: StyleSpecification = {
  version: 8,
  name: "SportsHub Clean Light",
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
        "background-color": "#f1f3f4",
      },
    },
    {
      id: "landcover-green",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["grass", "wood", "farmland", "wetland"]]],
      paint: {
        "fill-color": "#cce8cc",
        "fill-opacity": 0.92,
      },
    },
    {
      id: "park-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "park",
      paint: {
        "fill-color": "#c3e6c3",
        "fill-opacity": 0.92,
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
        "fill-color": "#e8ecef",
        "fill-opacity": 0.65,
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
          "#addfa8",
          "#c6e8c6",
        ],
        "fill-opacity": 0.96,
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
        "line-color": "#9cd3f5",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.2, 16, 3.5],
      },
    },
    {
      id: "water-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "water",
      paint: {
        "fill-color": "#9cd3f5",
      },
    },
    {
      id: "building-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "building",
      minzoom: 13,
      paint: {
        "fill-color": "#e2e6ea",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 13.8, 0.94],
      },
    },
    {
      id: "building-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "building",
      minzoom: 13.5,
      paint: {
        "line-color": "#ccd2da",
        "line-width": 0.8,
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
        "line-color": "#d4c3c3",
        "line-width": 0.85,
        "line-dasharray": [4, 2],
        "line-opacity": 0.55,
      },
    },
    {
      id: "rail-line",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["rail", "transit"]]],
      paint: {
        "line-color": "#c9d1dc",
        "line-width": 1.15,
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
        "line-color": "#d9dfe6",
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
        "line-color": "#d6dce3",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 14, 4.2, 16, 7.8],
      },
    },
    {
      id: "road-major-casing",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "primary"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#c7d0dc",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 14, 6.5, 16, 11],
      },
    },
    {
      id: "road-highway-casing",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#e8c474",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3.6, 14, 7.2, 16, 12],
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
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 14, 2.7, 16, 5.8],
      },
    },
    {
      id: "road-major-fill",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "primary"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.8, 14, 4.6, 16, 8.6],
      },
    },
    {
      id: "road-highway-fill",
      type: "line",
      source: SOURCE_ID,
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#fde9a8",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 2.2, 14, 5.2, 16, 9.4],
      },
    },
    {
      id: "road-label-minor",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "transportation_name",
      minzoom: 14,
      filter: ["in", ["get", "class"], ["literal", ["tertiary", "minor"]]],
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 380,
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10.5, 16, 12],
        "text-letter-spacing": 0.02,
        "text-max-angle": 28,
      },
      paint: {
        "text-color": "#5f6368",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    {
      id: "road-label-major",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": "transportation_name",
      minzoom: 13.5,
      filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]],
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 340,
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 13.5, 11, 16, 12.5],
        "text-letter-spacing": 0.02,
        "text-max-angle": 28,
      },
      paint: {
        "text-color": "#3c4043",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
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
        "text-size": 11,
        "text-letter-spacing": 0.02,
      },
      paint: {
        "text-color": "#3878a3",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
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
        "text-font": ["Noto Sans Bold"],
        "text-size": ["match", ["get", "class"], "city", 14.5, "town", 13.5, 12],
        "text-letter-spacing": 0.02,
        "text-max-width": 8,
        "text-padding": 16,
      },
      paint: {
        "text-color": "#3c4043",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
  ],
};
