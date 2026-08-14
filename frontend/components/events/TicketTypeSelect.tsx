"use client";

import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { SortedEventTicketType } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getEventPriceDisplay, isFreeEvent } from "@/utilities/priceUtils";
import { Option, Select } from "@material-tailwind/react";

interface TicketTypeSelectProps {
  activeTypes: SortedEventTicketType[];
  selectedTypeId: EventTicketTypeId | null;
  onChange: (value?: string) => void;
  className?: string;
}

function formatTicketTypeOptionLabel({ eventTicketType }: SortedEventTicketType): string {
  const soldOut = eventTicketType.vacancy === 0 ? " (Sold out)" : "";
  const detail = !isFreeEvent(eventTicketType.price)
    ? ` — ${getEventPriceDisplay(eventTicketType.price, true)}`
    : ` — ${eventTicketType.vacancy} left`;
  return `${eventTicketType.name}${soldOut}${detail}`;
}

export default function TicketTypeSelect({
  activeTypes,
  selectedTypeId,
  onChange,
  className = "mb-4 !text-black",
}: TicketTypeSelectProps) {
  return (
    <div className={className}>
      <Select
        className="text-black"
        label="Ticket type"
        size="lg"
        value={selectedTypeId ?? ""}
        onChange={onChange}
        selected={() => {
          const selected = activeTypes.find((entry) => entry.eventTicketTypeId === selectedTypeId);
          return selected ? formatTicketTypeOptionLabel(selected) : undefined;
        }}
      >
        {activeTypes.map((entry) => (
          <Option key={entry.eventTicketTypeId} value={entry.eventTicketTypeId}>
            {formatTicketTypeOptionLabel(entry)}
          </Option>
        ))}
      </Select>
    </div>
  );
}
