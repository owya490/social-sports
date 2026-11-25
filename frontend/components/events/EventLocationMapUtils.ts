import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";

export const EVENT_LOCATION_MAP_ZOOM = 15;
export const ESRI_LIGHT_GRAY_MAX_ZOOM = 16;
export const ESRI_LIGHT_GRAY_BASE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const ESRI_LIGHT_GRAY_REFERENCE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
export const ESRI_LIGHT_GRAY_ATTRIBUTION = "&copy; Esri, HERE, Garmin, OpenStreetMap contributors";

export const LOCKED_LEAFLET_MAP_OPTIONS = {
  zoomControl: false,
  dragging: false,
  touchZoom: false,
  doubleClickZoom: false,
  scrollWheelZoom: false,
  boxZoom: false,
  keyboard: false,
  attributionControl: true,
} as const;

export interface EventCoordinates {
  lat: number;
  lng: number;
}

export function hasValidEventCoordinates(locationLatLng?: EventCoordinates | null): locationLatLng is EventCoordinates {
  if (!locationLatLng) {
    return false;
  }

  const { lat, lng } = locationLatLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (lat === INVALID_LAT && lng === INVALID_LNG) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
