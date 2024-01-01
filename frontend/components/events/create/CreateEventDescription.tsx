import React, { useState } from "react";
import { Textarea } from "@material-tailwind/react";

export function CreateEventDescription() {
    const maxWords = 500;
    const [inputValue, setInputValue] = useState("");

    const handleChange = (e: { target: { value: any; }; }) => {
        const updatedValue = e.target.value;
        const words = updatedValue.split(/\s+/).filter((word: string) => word !== '');
        if (words.length <= maxWords) {
            setInputValue(updatedValue);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 mt-10">
            <h2 className="mb-0 text-black text-xl">Description of your event</h2>
            <div className="relative flex w-full max-w-xl">
                <Textarea
                    size="lg"
                    value={inputValue}
                    onChange={handleChange}
                    className="flex-grow"
                    rows={16}
                />
                <p className="absolute bottom-0 right-0 text-gray-500">
                    {maxWords - inputValue.split(/\s+/).filter((word) => word !== '').length} words remaining
                </p>
            </div>
        </div>
    );
}
