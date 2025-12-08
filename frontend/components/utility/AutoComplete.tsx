import { getLocationCoordinates, initializeAutocomplete, loadGoogleMapsScript } from "@/services/src/maps/mapsService";
import { Input } from "@material-tailwind/react";
import React, { useEffect, useRef, useState } from "react";
import { BasicData } from "../events/create/forms/BasicForm";

interface AutocompleteFormProps {
  location: string;
  updateField: (fields: Partial<BasicData>) => void;
  setHasLocationError: (value: boolean) => void;
}

const LocationAutocompleteForm: React.FC<AutocompleteFormProps> = ({ location, updateField, setHasLocationError }) => {
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

  const handlePlaceSelect = async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.name && place.formatted_address) {
        const full_address = `${place.name}, ${place.formatted_address}`;
        setAddress(full_address);
        updateField({ location: full_address });

        try {
          const { lat, lng } = await getLocationCoordinates(full_address);
          updateField({ lat, lng });
          setHasLocationError(false);
          inputRef.current?.setCustomValidity("");
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === "") {
      setAddress("");
      updateField({ location: "" });
      setHasLocationError(true);
      inputRef.current?.setCustomValidity("Please Select Location");
    }
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (loadError) return <div>Error loading maps</div>;

  return (
    <div>
      <Input
        inputRef={inputRef}
        label="Location"
        crossOrigin={undefined}
        type="text"
        onChange={(e) => {
          setAddress(e.target.value);
        }}
        value={address}
        onBlur={(e) => handleInputBlur(e)}
        placeholder="Enter a location"
        className="rounded-md focus:ring-0"
        size="lg"
        required
      />
    </div>
  );
};

export default LocationAutocompleteForm;
