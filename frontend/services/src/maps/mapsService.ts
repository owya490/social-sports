import { BasicData } from "@/components/events/create/forms/BasicForm";
import { Environment, getEnvironment } from "@/utilities/environment";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

const getGoogleMapsApiKey = () => {
  const env = getEnvironment();
  if (env === Environment.DEVELOPMENT) {
    return process.env.GOOGLE_MAPS_DEV_API_KEY;
  }
  if (env === Environment.PRODUCTION) {
    return process.env.GOOGLE_MAPS_PROD_API_KEY;
  }
  throw new Error("Google Maps API Key is not defined");
};

const loadGoogleMapsScript = () => {
  const googleMapsApiKey = getGoogleMapsApiKey();
  if (!googleMapsApiKey) {
    return null;
  }
  return useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });
};

const initializeAutocomplete = (inputRef: React.RefObject<HTMLInputElement>, handlePlaceSelect: () => void) => {
  if (!window.google || !window.google.maps) {
    console.error("Google Maps JavaScript API is not loaded.");
    return null;
  }
  if (!inputRef.current) {
    return null;
  }
  const options = {
    types: ["address"],
    componentRestrictions: { country: "au" },
  };
  const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
  autocomplete.addListener("place_changed", handlePlaceSelect);
  return autocomplete;
};

const validateLocation = (location: string): Promise<{ lat: number; long: number }> => {
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
        resolve({ lat: latitude, long: longitude });
      } else {
        reject(new Error("Location not Found"));
      }
    });
  });
};

export { loadGoogleMapsScript, initializeAutocomplete, validateLocation };
