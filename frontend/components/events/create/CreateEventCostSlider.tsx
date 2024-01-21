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

  // Update the slider when the initialCustomAmount prop changes
  useEffect(() => {
    setEventCost(initialCustomAmount);
  }, [initialCustomAmount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setEventCost(value);
    onCustomAmountChange(value); // Notify the parent component about the change
  };

  const customAmountPosition = `calc(${(eventCost / 60) * 100}% - 50%)`;

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="w-full">
        <Slider
          size="sm"
          value={eventCost}
          onChange={handleSliderChange}
          min={0}
          max={60}
          step={1}
          className="text-black relative z-10"
          barClassName="rounded-none bg-gray-300" // Adjusted the bar background color
          thumbClassName="rounded-full bg-white z-20" // Made the thumb fully visible
          trackClassName="rounded-none border border-gray-300"
        />
      </div>
      <div
        className="mt-2 text-black text-center w-full"
        style={{ left: customAmountPosition }}
      >
        ${eventCost}
      </div>
    </div>
  );
}

export default CreateEventCostSlider;
