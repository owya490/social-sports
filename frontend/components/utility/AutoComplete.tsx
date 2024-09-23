import React, { useState, useRef, useEffect } from "react";
import { loadGoogleMapsScript, initializeAutocomplete, validateLocation } from "@/services/src/maps/mapsService";
import { BasicData } from "../events/create/forms/BasicForm";

interface AutocompleteFormProps {
  location: string;
  updateField: (fields: Partial<BasicData>) => void;
  setHasError: (value: boolean) => void;
  setLocationError: (value: string) => void;
}

const LocationAutocompleteForm: React.FC<AutocompleteFormProps> = ({
  location,
  updateField,
  setHasError,
  setLocationError,
}) => {
  const [address, setAddress] = useState<string>(location);
  const [selectionMade, setSelectionMade] = useState<boolean>(false); // To track if a selection is made
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

  const handlePlaceSelect = async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        setSelectionMade(true);
        updateField({ location: place.formatted_address });

        try {
          const { lat, long } = await validateLocation(place.formatted_address);
          updateField({ lat, long });
          setHasError(false);
          setLocationError("");
        } catch (error) {
          console.error(error);
          setHasError(true);
        }
      }
    }
  };

  const handleInputBlur = () => {
    if (!selectionMade) {
      setAddress("");
      updateField({ location: "" });
      setHasError(true);
      setLocationError("Please Select Location");
    }
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (loadError) return <div>Error loading maps</div>;

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        onChange={(e) => {
          setAddress(e.target.value);
          setSelectionMade(false);
        }}
        value={address}
        onBlur={handleInputBlur}
        placeholder="Enter a location"
        style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        required
      />
    </div>
  );
};

export default LocationAutocompleteForm;
