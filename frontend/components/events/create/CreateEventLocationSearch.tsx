import { Input } from "@material-tailwind/react";
import { useState } from 'react';

export function CreateEventLocationSearch() {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="flex flex-col items-start space-y-4 ml-40 mt-10"> 
      <div className="flex flex-col items-start w-96"> {/* Adjust the width as needed */}
        <label className="mb-2 text-black text-xl">Enter your Location</label>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          crossOrigin={undefined}
          className="rounded-md"
        />
      </div>
    </div>
  );
}