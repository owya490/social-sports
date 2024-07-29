import React, { useState, useRef, useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

const AutocompleteForm: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyD_lrwGBaSDSTGj95CQ3vzNBo3qLKFzOug", // Replace with your API key
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
      setAddress(place.formatted_address || "");
    }
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (loadError) return <div>Error loading maps</div>;

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter a location"
        onChange={(e) => setAddress(e.target.value)}
        value={address}
      />
    </div>
  );
};

export default AutocompleteForm;
