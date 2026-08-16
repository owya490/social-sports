"use client";

import { Option, Select } from "@material-tailwind/react";

interface TicketCountSelectProps {
  label: string;
  value: number;
  options: number[];
  onChange: (value?: string) => void;
  formatOption: (count: number) => string;
  /**
   * Remount when the option set changes. Material Tailwind Select caches option
   * values on first render and will otherwise draw a blank selected value.
   */
  selectKey: string;
  className?: string;
}

export default function TicketCountSelect({
  label,
  value,
  options,
  onChange,
  formatOption,
  selectKey,
  className = "text-black",
}: TicketCountSelectProps) {
  return (
    <Select
      key={selectKey}
      className={className}
      label={label}
      size="lg"
      value={`${value}`}
      onChange={onChange}
      selected={() => formatOption(value)}
    >
      {options.map((count) => (
        <Option key={`attendee-option-${count}`} value={`${count}`}>
          {formatOption(count)}
        </Option>
      ))}
    </Select>
  );
}
