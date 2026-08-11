"use client";

import {
  darkerCompanionFor,
  DEFAULT_PROFILE_COLOUR,
  PROFILE_COLOUR_OPTIONS,
  resolveProfileColour,
} from "@/services/src/users/profileColour";
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
  const companion = darkerCompanionFor(colour);
  // White gap so the colour ring reads against the fill; outer ring = darker companion.
  return {
    backgroundColor: colour,
    boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px ${colour}, 0 0 0 7px ${companion}`,
  };
}

export function ProfileColourSelector({ value, onChange, disabled = false }: ProfileColourSelectorProps) {
  const selected = resolveProfileColour(value);

  return (
    <div>
      <strong className="text-xs md:text-md font-medium text-gray-700">Profile colour</strong>
      <p className="text-xs font-light text-gray-500 mt-0.5 mb-2">
        Used for accents in your Organiser Hub. Default is sports yellow.
      </p>
      <div className="flex flex-wrap gap-2.5 p-0.5" role="radiogroup" aria-label="Profile colour">
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
                void onChange(option.value);
              }}
              className={`h-8 w-8 rounded-full border-2 border-transparent transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:pointer-events-none ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
              style={swatchStyle(option.value, isSelected)}
            />
          );
        })}
      </div>
      {selected !== DEFAULT_PROFILE_COLOUR && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onChange(DEFAULT_PROFILE_COLOUR)}
          className="mt-2 text-xs text-gray-600 hover:underline disabled:opacity-50"
        >
          Reset to sports yellow
        </button>
      )}
    </div>
  );
}
