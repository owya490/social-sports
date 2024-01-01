import React, { useState } from "react";
import { Slider } from "@material-tailwind/react";

function CreateEventCostSlider() {
    const [eventCost, setEventCost] = useState(0);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setEventCost(value);
    };

    const customAmountPosition = `calc(${(eventCost / 60) * 100}% - 50%)`;

    return (
        <div className="flex flex-col items-center mt-10">
            <label className="text-black text-xl mb-2">
                Cost per Person
            </label>
            <div className="w-2/3"> {/* Adjust the width as needed */}
                <Slider
                    value={eventCost}
                    onChange={handleSliderChange}
                    min={0}
                    max={60}
                    step={1}
                    className="text-black relative z-10"
                    barClassName="rounded-none bg-transparent"
                    thumbClassName="rounded-none bg-transparent z-20" // Updated to make the thumb transparent
                    trackClassName="rounded-none border border-gray-300 z-0" // Updated to remove background color and use a border
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
