"use client";
import ListBox from "../ListBox";

interface EventPaymentListBoxProps {
  onGuestCountChange: (count: number) => void;
  vacancy: number;
}

export default function EventPaymentListBox(props: EventPaymentListBoxProps) {
  const MAX_OPTION_SIZE = 7;
  const options = [];

  for (let i = 1; i <= Math.min(MAX_OPTION_SIZE, props.vacancy); i++) {
    options.push({ name: `${i} ${i == 1 ? "Guest" : "Guests"}`, value: i });
  }

  return (
    <div className="p-[9%] mb-5 w-full">
      <ListBox onChangeHandler={props.onGuestCountChange} options={options} />
    </div>
  );
}
