import React, { useState, useRef, useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Input } from "@material-tailwind/react";

const libraries: "places"[] = ["places"];

type BasicData = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  sport: string;
  price: number;
  capacity: number;
  isPrivate: boolean;
  paymentsActive: boolean;
  lat: number;
  long: number;
};
interface AutocompleteFormProps {
  location: string;
  updateField: (fields: Partial<BasicData>) => void; // Ensure BasicData is imported or defined in this file
}

const AutocompleteForm: React.FC<AutocompleteFormProps> = ({ location, updateField }) => {
  const [address, setAddress] = useState<string>(location);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error("Google Maps API Key is not defined");
  }
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey, // Replace with your API key
    libraries,
  });

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const options = {
        types: ["address"],
      };
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        updateField({ location: place.formatted_address });
        validateLocation(place.formatted_address);
      }
    }
  };

  const validateLocation = async (location: string) => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps JavaScript API is not loaded.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const latLng = results[0].geometry.location;
        const latitude = latLng.lat();
        const longitude = latLng.lng();
        updateField({ lat: latitude, long: longitude });
      } else {
        console.error("Geocode was not successful for the following reason: " + status);
      }
    });
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (loadError) return <div>Error loading maps</div>;

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        // label="Enter a location"
        onChange={(e) => setAddress(e.target.value)}
        value={address}
        // Autocomplete doesn't work with tailwind for some reason
        style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        // className="rounded-md focus:ring-0"
        // size="lg"
        // crossOrigin={undefined}
        required
      />
    </div>
  );
};

export default AutocompleteForm;
