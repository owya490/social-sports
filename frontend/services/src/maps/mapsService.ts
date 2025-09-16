import { Environment, getEnvironment } from "@/utilities/environment";
import { useLoadScript } from "@react-google-maps/api";
// For some reason, need to require geofire-common to use methods???
const geofire = require("geofire-common");

export const SYDNEY_LAT = -33.8688;
export const SYDNEY_LNG = 151.2093;
const libraries: "places"[] = ["places"];

const getGoogleMapsApiKey = () => {
  const env = getEnvironment();
  if (env === Environment.PRODUCTION) {
    return process.env.GOOGLE_MAPS_PROD_API_KEY;
  } else {
    return process.env.GOOGLE_MAPS_DEV_API_KEY;
  }
};

export const loadGoogleMapsScript = () => {
  const googleMapsApiKey = getGoogleMapsApiKey();
  if (!googleMapsApiKey) {
    return null;
  }
  return useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });
};

export const initializeAutocomplete = (inputRef: React.RefObject<HTMLInputElement>, handlePlaceSelect: () => void) => {
  if (!window.google || !window.google.maps) {
    console.error("Google Maps JavaScript API is not loaded.");
    return null;
  }
  if (!inputRef.current) {
    return null;
  }
  const options = {
    types: ["geocode", "establishment"],
    componentRestrictions: { country: "au" },
  };
  const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
  autocomplete.addListener("place_changed", handlePlaceSelect);
  return autocomplete;
};

export const getLocationCoordinates = (location: string): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps JavaScript API is not loaded.");
      reject(new Error("Google Maps JavaScript API is not loaded."));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const latLng = results[0].geometry.location;
        const latitude = latLng.lat();
        const longitude = latLng.lng();
        resolve({ lat: latitude, lng: longitude }); 
      } else {
        reject(new Error("Location not Found"));
      }
    });
  });
};

export function getDistanceBetweenTwoCoords([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  return geofire.distanceBetween([lat1, lng1], [lat2, lng2]);
}
