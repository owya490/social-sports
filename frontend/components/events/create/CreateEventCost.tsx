import React, { useState } from "react";

function EventCostSlider() {
    const [eventCost, setEventCost] = useState(2.5); // Initial value

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEventCost(parseFloat(e.target.value));
    };

    return (
        <div className="flex flex-col justify-center items-center">
            <label
                htmlFor="customRange2"
                className="mb-2 inline-block text-neutral-700 dark:text-neutral-200"
            >
                Example range
            </label>
            <div className="w-4/5 relative">
                <input
                    type="range"
                    className="transparent h-[10px] w-full cursor-pointer absolute inset-0 appearance-none border-transparent bg-blue-900 dark:bg-blue-900" // Set the background color to dark blue
                    min="0"
                    max="50"
                    step="5"
                    id="customRange2"
                    value={eventCost}
                    onChange={handleSliderChange}
                />
                <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-200">
                    <span>0</span>
                    <span>50</span>
                </div>
            </div>
        </div>
    );
}

export default EventCostSlider;
