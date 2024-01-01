import axios from "axios";

// For some reason, need to require geofire-common to use methods???
const geofire = require("geofire-common");

export const SYDNEY_LAT = -33.8688;
export const SYDNEY_LNG = 151.2093;

export async function getLocationCoordinates(
  locationName: string
): Promise<{ lat: number; lng: number }> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        locationName
      )}`
    );

    if (response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    } else {
      throw new Error("Location not found");
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    throw error;
  }
}

export function getDistanceBetweenTwoCoords(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  return geofire.distanceBetween([lat1, lng1], [lat2, lng2]);
}
