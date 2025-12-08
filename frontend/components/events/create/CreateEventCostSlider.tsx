"use client";

import { MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS } from "@/services/src/stripe/stripeConstants";
import { Slider } from "@material-tailwind/react";
import React, { useEffect, useState } from "react";

const MIN_COST = MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS / 100;
const MAX_COST = 60;

interface CreateEventCostSliderProps {
  initialCustomAmount?: number;
  onCustomAmountChange: (amount: number) => void;
  setPriceWarning: (warning: string | null) => void;
}

function CreateEventCostSlider({
  initialCustomAmount = 30, // Set the initial value to 30
  onCustomAmountChange,
  setPriceWarning,
}: CreateEventCostSliderProps) {
  const [eventCost, setEventCost] = useState(initialCustomAmount);
  const [displayedCost, setDisplayedCost] = useState(initialCustomAmount);

  // Update the slider when the initialCustomAmount prop changes
  useEffect(() => {
    // Clamp the initialCustomAmount between MIN_COST and MAX_COST
    const clampedInitialAmount = Math.min(Math.max(initialCustomAmount, MIN_COST), MAX_COST);
    setEventCost(clampedInitialAmount);
    setDisplayedCost(initialCustomAmount); // Display the actual entered amount, even if it's beyond MAX_COST
  }, [initialCustomAmount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    const clampedValue = Math.min(Math.max(value, MIN_COST), MAX_COST);
    setPriceWarning(null);

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
          step={0.5}
          aria-label="Event ticket price in dollars"
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
