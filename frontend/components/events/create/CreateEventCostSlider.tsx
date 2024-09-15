import { Slider } from "@material-tailwind/react";
import React, { useEffect, useState } from "react";

interface CreateEventCostSliderProps {
  initialCustomAmount?: number;
  onCustomAmountChange: (amount: number) => void;
}

function CreateEventCostSlider({
  initialCustomAmount = 30, // Set the initial value to 30
  onCustomAmountChange,
}: CreateEventCostSliderProps) {
  const [eventCost, setEventCost] = useState(initialCustomAmount);
  const [displayedCost, setDisplayedCost] = useState(initialCustomAmount);

  // Define the slider's min and max values
  const MIN_COST = 0;
  const MAX_COST = 60;

  // Update the slider when the initialCustomAmount prop changes
  useEffect(() => {
    // Clamp the initialCustomAmount between MIN_COST and MAX_COST
    const clampedInitialAmount = Math.min(Math.max(initialCustomAmount, MIN_COST), MAX_COST);
    setEventCost(clampedInitialAmount);
    setDisplayedCost(initialCustomAmount); // Display the actual entered amount, even if it's beyond MAX_COST
  }, [initialCustomAmount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    // Clamp the value within the defined range
    const clampedValue = Math.min(Math.max(value, MIN_COST), MAX_COST);

    setEventCost(clampedValue);
    setDisplayedCost(value); // Always display the actual entered value
    onCustomAmountChange(clampedValue); // Notify the parent component about the change
  };

  // Adjust the customAmountPosition for the slider label
  const customAmountPosition = `calc(${(eventCost / MAX_COST) * 100}% - 50%)`;

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="w-full md:w-96"> 
        <Slider
          size="sm"
          value={eventCost}
          onChange={handleSliderChange}
          min={MIN_COST}
          max={MAX_COST}
          step={1}
          className="text-black relative z-10"
          barClassName="rounded-none bg-gray-300"
          thumbClassName="rounded-full bg-white z-20"
          trackClassName="rounded-none border border-gray-300"
        />
      </div>
      <div className="mt-2 text-black text-center w-full" style={{ left: customAmountPosition }}>
        ${displayedCost.toFixed(2)} 
      </div>
      
    </div>
  );
}

export default CreateEventCostSlider;
