/**
 * Venue IANA zone from a pin. Coordinates win, then a stored id, then Sydney.
 * The boxes match EventTimeZone for Australian city coordinates. Points outside
 * that Australia box (including New Zealand) do not resolve here, so they still
 * fall back to Sydney.
 */

export const FALLBACK_ZONE_ID = "Australia/Sydney";

const MIN_LAT = -55;
const MIN_LNG = 96;
const MAX_LAT = -9;
const MAX_LNG = 168.5;

export function isIanaZone(timezone: string | null | undefined): timezone is string {
  if (!timezone || !timezone.includes("/") || timezone.startsWith("Etc/")) {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function hasUsableCoordinates(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  if ((lat === 0 && lng === 0) || (lat === -1 && lng === -1)) {
    return false;
  }
  return true;
}

/** IANA id for a usable pin inside the Australia box, otherwise null. */
export function lookupVenueTimeZoneId(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (!hasUsableCoordinates(lat, lng) || lat == null || lng == null) {
    return null;
  }
  if (lat < MIN_LAT || lat > MAX_LAT || lng < MIN_LNG || lng > MAX_LNG) {
    return null;
  }
  return australianZone(lat, lng);
}

export function resolveVenueTimeZoneId(
  timezone: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined
): string {
  return lookupVenueTimeZoneId(lat, lng) ?? (isIanaZone(timezone) ? timezone : FALLBACK_ZONE_ID);
}

function australianZone(lat: number, lng: number): string {
  if (lat <= -11.8 && lat >= -12.3 && lng >= 96.7 && lng <= 97.1) {
    return "Indian/Cocos";
  }
  if (lat <= -10.3 && lat >= -10.6 && lng >= 105.5 && lng <= 105.8) {
    return "Indian/Christmas";
  }
  if (lat <= -28.9 && lat >= -29.2 && lng >= 167.9 && lng <= 168.1) {
    return "Pacific/Norfolk";
  }
  if (lat <= -31.4 && lat >= -31.7 && lng >= 158.8 && lng <= 159.3) {
    return "Australia/Lord_Howe";
  }
  if (lat < -53.5 && lng >= 158 && lng <= 160) {
    return "Antarctica/Macquarie";
  }
  if (lat <= -31.4 && lat >= -32.6 && lng >= 125.5 && lng <= 129.1) {
    return "Australia/Eucla";
  }
  if (lat <= -31.6 && lat >= -32.4 && lng >= 141.1 && lng <= 141.7) {
    return "Australia/Broken_Hill";
  }
  if (lat > -26 && lng >= 129 && lng < 138) {
    return "Australia/Darwin";
  }
  if (lng < 129) {
    return "Australia/Perth";
  }
  if (lng < 141 && lat <= -26) {
    return "Australia/Adelaide";
  }
  if (lat < -39.5 && lng > 143) {
    return "Australia/Hobart";
  }
  if (lat < -36.5 && lng >= 140.9 && lng < 149.2) {
    return "Australia/Melbourne";
  }
  if (lat > -28.15 && lng >= 138) {
    return "Australia/Brisbane";
  }
  return FALLBACK_ZONE_ID;
}
