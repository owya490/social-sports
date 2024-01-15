import { Input } from "@material-tailwind/react";
import { FormWrapper } from "./FormWrapper";
import { useState } from "react"; // Import useState for managing warning state

type BasicData = {
  date: string;
  time_start: string;
  time_finish: string;
};

type BasicInformationProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function TimeSlot({
  date,
  time_start,
  time_finish,
  updateField,
}: BasicInformationProps) {
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  const handleDateChange = (selectedDate: string) => {
    // Validate if the selected date is in the past
    const currentDate = new Date();
    const selectedDateObj = new Date(selectedDate);

    if (selectedDateObj < currentDate) {
      setDateWarning("Selected date is in the past.");
    } else {
      setDateWarning(null);
    }

    updateField({ date: selectedDate });
  };

  const handleStartTimeChange = (selectedTime: string) => {
    // Validate if end time is before start time
    if (time_finish && selectedTime >= time_finish) {
      setTimeWarning("End time must be after start time.");
    } else {
      setTimeWarning(null);
    }

    updateField({ time_start: selectedTime });
  };

  const handleEndTimeChange = (selectedTime: string) => {
    // Validate if end time is before start time
    if (selectedTime <= time_start) {
      setTimeWarning("End time must be after start time.");
    } else {
      setTimeWarning(null);
    }

    updateField({ time_finish: selectedTime });
  };

  return (
    <FormWrapper title="">
      <label className="font-semibold">Date</label>
      <input
        className="border-2 rounded-full p-2"
        autoFocus
        required
        type="date"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
      />
      {dateWarning && <p className="text-red-500">{dateWarning}</p>}

      <label className="font-semibold">Time Start</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="time"
        value={time_start}
        onChange={(e) => handleStartTimeChange(e.target.value)}
      />

      <label className="font-semibold">Time Finish</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="time"
        value={time_finish}
        onChange={(e) => handleEndTimeChange(e.target.value)}
      />
      {timeWarning && <p className="text-red-500">{timeWarning}</p>}
    </FormWrapper>
  );
}
