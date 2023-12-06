import React, { useState } from "react";
import { Slider } from "@material-tailwind/react";

function CreateEventCostSlider() {
    const [eventCost, setEventCost] = useState(0); // Initial value

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setEventCost(value);
    };

    const customAmountPosition = `calc(${(eventCost / 60) * 100}% - 50%)`;

    return (
        <div className="flex justify-center relative">
            <div className="w-3/5 mt-10 relative">
                <label className="text-black text-xl mb-2">
                    Cost per Person
                </label>
                <Slider
                    value={eventCost}
                    onChange={handleSliderChange}
                    min={0}
                    max={60}
                    step={1}
                    className="text-black relative z-10" // Set the z-index to ensure it's above other elements
                    barClassName="rounded-none bg-transparent" // Set the background color to transparent
                    thumbClassName="[&::-moz-range-thumb]:rounded-none [&::-webkit-slider-thumb]:rounded-none [&::-moz-range-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:-mt-[4px] bg-[#2ec946] z-20" // Set the background color to the desired color
                    trackClassName="[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent rounded-none !bg-[#2ec946]/10 border border-[#2ec946]/20 z-0" // Set the z-index to ensure it's below other elements
                />
                <div
                    className="absolute top-[-30px] left-0 text-black text-center w-full"
                    style={{ left: customAmountPosition }}
                >
                    ${eventCost}
                </div>
            </div>
        </div>
    );
}

export default CreateEventCostSlider;
