import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";

export const EVENT_LOCATION_MAP_ZOOM = 14.5;

export const LOCKED_MAPLIBRE_OPTIONS = {
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

export function toMapLibreLngLat(coordinates: EventCoordinates): [number, number] {
  return [coordinates.lng, coordinates.lat];
}
