import axios from "axios";

interface NominatimResponse {
  lat: string;
  lon: string;
}

export async function getLocationCoordinates(
  locationName: string
): Promise<{ lat: number; lon: number }> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        locationName
      )}`
    );

    if (response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      throw new Error("Location not found");
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    throw error;
  }
}
