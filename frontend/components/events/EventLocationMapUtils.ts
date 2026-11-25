import { INVALID_LAT, INVALID_LNG } from "@/interfaces/EventTypes";

export const EVENT_LOCATION_MAP_ZOOM = 15;
export const OPENSTREETMAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OPENSTREETMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

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

export function getEventDirectionsUrl(location: string, locationLatLng: EventCoordinates): string {
  const trimmedLocation = location.trim();
  const query = trimmedLocation.length > 0 ? trimmedLocation : `${locationLatLng.lat},${locationLatLng.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
