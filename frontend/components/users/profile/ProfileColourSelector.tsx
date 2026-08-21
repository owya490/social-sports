"use client";

import { isValidProfileColourHex, PROFILE_COLOUR_OPTIONS } from "@/services/src/users/profileColour";
import type { CSSProperties } from "react";

interface ProfileColourSelectorProps {
  value: string | undefined;
  onChange: (colour: string) => void | Promise<void>;
  disabled?: boolean;
}

function swatchStyle(colour: string, isSelected: boolean): CSSProperties {
  if (!isSelected) {
    return { backgroundColor: colour };
  }
  // White gap keeps the black outline visible on dark swatches (grey/black).
  return {
    backgroundColor: colour,
    boxShadow: "0 0 0 2px #ffffff, 0 0 0 4px #0a0a0a",
  };
}

export function ProfileColourSelector({ value, onChange, disabled = false }: ProfileColourSelectorProps) {
  const selected = isValidProfileColourHex(value) ? value.toLowerCase() : null;

  return (
    <div>
      <strong className="text-xs md:text-md font-medium text-gray-700">Profile colour</strong>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Profile colour">
        {PROFILE_COLOUR_OPTIONS.map((option) => {
          const isSelected = selected === option.value.toLowerCase();
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              title={option.label}
              disabled={disabled}
              onClick={() => {
                if (option.value.toLowerCase() === selected) return;
                void onChange(option.value.toLowerCase());
              }}
              className={`h-7 w-7 rounded-full border border-transparent transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:pointer-events-none ${
                isSelected ? "scale-105" : "hover:scale-105"
              }`}
              style={swatchStyle(option.value, isSelected)}
            />
          );
        })}
      </div>
    </div>
  );
}
