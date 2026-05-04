"use client";
import { getBuyerTicketCountOptions } from "@/services/src/events/eventsUtils/ticketLimits";
import { SortByCategory } from "../Filter/FilterDialog";
import ListBox from "../ListBox";

interface EventPaymentListBoxProps {
  onGuestCountChange: (count: number) => void;
  vacancy: number;
}

export default function EventPaymentListBox(props: EventPaymentListBoxProps) {
  const options = getBuyerTicketCountOptions(props.vacancy).map((count) => ({
    name: `${count} ${count === 1 ? "Guest" : "Guests"}`,
    value: count,
  }));

  return (
    <div className="p-[9%] mb-5 w-full">
      <ListBox sortByCategory={SortByCategory.HOT} onChangeHandler={props.onGuestCountChange} options={options} />
    </div>
  );
}
