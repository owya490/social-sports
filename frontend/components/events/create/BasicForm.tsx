// BasicInformation.tsx

import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Input, Option, Select } from "@material-tailwind/react";
import { useState } from "react";
import CreateEventCostSlider from "./CreateEventCostSlider";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  name: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  sport: string;
  cost: number;
  people: number;
};

type BasicInformationProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function BasicInformation({
  name,
  location,
  date,
  startTime,
  endTime,
  sport,
  cost,
  people,
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
    if (endTime && selectedTime >= endTime) {
      setTimeWarning("End time must be after start time.");
    } else {
      setTimeWarning(null);
    }

    updateField({ startTime: selectedTime });
  };

  const handleEndTimeChange = (selectedTime: string) => {
    // Validate if end time is before start time
    if (selectedTime <= startTime) {
      setTimeWarning("End time must be after start time.");
    } else {
      setTimeWarning(null);
    }

    updateField({ endTime: selectedTime });
  };

  const [customAmount, setCustomAmount] = useState(cost);

  const handleCustomAmountChange = (amount: number) => {
    setCustomAmount(amount);
    updateField({ cost: amount }); // Update the cost field in the parent component
  };

  return (
    <FormWrapper>
      <div className="space-y-12">
        <div>
          <label className="text-black text-lg font-semibold">
            What’s the name of your event?
          </label>
          <p className="text-sm mb-5 mt-2">
            This will be your event’s title. Your title will be used to help
            create your event’s summary, description, category, and tags – so be
            specific!
          </p>
          <Input
            label="Event Name"
            crossOrigin={undefined}
            required
            value={name}
            onChange={(e) => updateField({ name: e.target.value })}
            className="rounded-md"
            size="lg"
          />
        </div>
        <div>
          <label className="text-black text-lg font-semibold">
            When does your event start and end?
          </label>
          <div className="flex space-x-2 mt-4">
            <div className="basis-1/2">
              {/* <CustomDateInput
              date={date}
              placeholder="Date"
              handleChange={handleDateChange}
            /> */}
              <Input
                label="Date"
                crossOrigin={undefined}
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="rounded-md"
                size="lg"
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>
            <div className="basis-1/4">
              {/* <CustomTimeInput
              value={startTime}
              placeholder="Start time"
              handleChange={handleStartTimeChange}
            /> */}
              <Input
                label="Start time"
                crossOrigin={undefined}
                required
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="rounded-md"
                size="lg"
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>
            <div className="basis-1/4">
              {/* <CustomTimeInput
              value={endTime}
              placeholder="End time"
              handleChange={handleEndTimeChange}
            /> */}
              <Input
                label="End time"
                crossOrigin={undefined}
                required
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="rounded-md"
                size="lg"
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-black text-lg font-semibold">
            Where is it located?
          </label>
          <div className="mt-4">
            <Input
              label="Location"
              crossOrigin={undefined}
              required
              value={location}
              onChange={(e) => updateField({ location: e.target.value })}
              className="rounded-md"
              size="lg"
              icon={<MapPinIcon />}
            />
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">
            What Sport is it?
          </label>
          <div className="mt-4">
            <Select
              label="Select Sport"
              size="lg"
              onChange={(e) => {
                updateField({ sport: e });
              }}
            >
              <Option value="volleyball">Volleyball</Option>
              <Option value="badminton">Badminton</Option>
              <Option value="basketball">Basketball</Option>
              <Option value="soccer">Soccer</Option>
              <Option value="tennis">Tennis</Option>
              <Option value="table-tennis">Table Tennis</Option>
              <Option value="oztag">Oztag</Option>
              <Option value="baseball">Baseball</Option>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">
            What is the price of the event and max capacity?
          </label>
          <p className="text-sm mt-2 mb-5">
            Event price is the cost of each ticket. Event capacity is the total
            number of tickets you're willing to sell.
          </p>

          <div className="w-full px-5">
            <CreateEventCostSlider
              initialCustomAmount={customAmount}
              onCustomAmountChange={handleCustomAmountChange}
            />
          </div>
          <div className="w-full flex space-x-3">
            <div className="mt-4 grow">
              <Input
                label="Price"
                crossOrigin={undefined}
                required
                value={cost}
                onChange={(e) =>
                  handleCustomAmountChange(parseInt(e.target.value))
                }
                className="rounded-md"
                size="lg"
                icon={<CurrencyDollarIcon />}
              />
            </div>
            <div className="mt-4 grow">
              <Input
                label="Capacity"
                crossOrigin={undefined}
                required
                value={people}
                onChange={(e) =>
                  updateField({ people: parseInt(e.target.value) })
                }
                className="rounded-md"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}
