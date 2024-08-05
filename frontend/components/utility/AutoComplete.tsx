import React, { useState, useRef, useEffect } from "react";
import { loadGoogleMapsScript, initializeAutocomplete, validateLocation } from "@/services/src/maps/mapsService";
import { BasicData } from "../events/create/forms/BasicForm";

interface AutocompleteFormProps {
  location: string;
  updateField: (fields: Partial<BasicData>) => void;
}

const AutocompleteForm: React.FC<AutocompleteFormProps> = ({ location, updateField }) => {
  const [address, setAddress] = useState<string>(location);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scriptLoadResult = loadGoogleMapsScript();
  const isLoaded = scriptLoadResult ? scriptLoadResult.isLoaded : false;
  const loadError = scriptLoadResult ? scriptLoadResult.loadError : undefined;

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      autocompleteRef.current = initializeAutocomplete(inputRef, handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        updateField({ location: place.formatted_address });
        validateLocation(place.formatted_address, updateField);
      }
    }
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (loadError) return <div>Error loading maps</div>;

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        onChange={(e) => setAddress(e.target.value)}
        value={address}
        style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        required
      />
    </div>
  );
};

export default AutocompleteForm;
