import React, { useState } from "react";

interface TextFieldProps {
    label: string;
    placeholder: string;
}

function TextField({ label, placeholder }: TextFieldProps) {
    const [textValue, setTextValue] = useState("");

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value);
    };

    return (
        <div className="items-center">
            <div className="flex flex-col">
                <label className="text-xl font-semibold text-gray-900 dark:text-black">
                    {label}
                </label>
                <input
                    type="text"
                    value={textValue}
                    onChange={handleTextChange}
                    className="w-1/2 h-10 bg-white rounded-lg p-2 border border-black dark:border-black mt-2"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

export default TextField;
