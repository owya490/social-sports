// BasicInformation.tsx

import { Frequency } from "@/interfaces/RecurringEventTypes";
import { RecurringEventsFrequencyMetadata } from "@/services/src/recurringEvents/recurringEventsConstants";
import { Radio, Switch } from "@mantine/core";
import { Option, Select } from "@material-tailwind/react";
import { useState } from "react";
import "./form.css";

export const RecurringEventsForm = () => {
  // TODO remove and transfer into form state
  const [enableRecurringEvents, setEnableRecurringEvents] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<Frequency>(Frequency.WEEKLY);

  return (
    <>
      <label className="text-black text-lg font-semibold">Recurring Events</label>
      <Switch
        color="teal"
        label="Enable Recurrence for this Event"
        size="sm"
        className="mt-4"
        checked={enableRecurringEvents}
        onChange={(event) => {
          setEnableRecurringEvents(event.currentTarget.checked);
        }}
      />
      {/* Styled in ./form.css to make it black and no ring border on focus */}
      <Radio.Group
        value={recurrenceFrequency}
        onChange={(e: Frequency) => {
          setRecurrenceFrequency(e);
        }}
        name="recurrenceInterval"
        label="Select your Recurrence Interval"
        description="This is how frequent your event will be re-created."
        withAsterisk
        className="mt-4 !text-black"
        color="dark"
      >
        <Radio value={Frequency.WEEKLY} label="Weekly" defaultChecked color="dark" variant="outline" />
        <Radio value={Frequency.FORTNIGHTLY} label="Fortnightly" color="dark" variant="outline" />
        <Radio value={Frequency.MONTHLY} label="Monthly" color="dark" variant="outline" />
      </Radio.Group>
      {/* <label className="text-black text-sm font-semibold">How many recurrences</label> */}
      {/* <Input
                  label="Number of recurrences?"
                  crossOrigin={undefined}
                  required
                  value={name}
                  onChange={(e) => updateField({ name: e.target.value })}
                  className="rounded-md focus:ring-0"
                  size="lg"
                /> */}
      <div className="mt-4">
        <div className="md:w-1/2">
          <Select
            size="md"
            label="Number of recurrences?"
            value={"1"}
            onChange={(e) => {
              const value = e || "Yes";
              // handleStripeFeesToCustomerChange(value);
            }}
          >
            {[...Array(6).keys()].map((value, idx) => {
              value += 1;
              return (
                <Option key={`numberOfRecurrence-option-${idx}`} value={`${value}`}>
                  {value == 1 ? "Once" : `${value} times`}
                </Option>
              );
            })}
          </Select>
        </div>
      </div>
      <div className="mt-4">
        <div className="md:w-1/2">
          <Select
            size="md"
            label="Number of days prior for event creation?"
            value={"1"}
            onChange={(e) => {
              const value = e || "Yes";
              // handleStripeFeesToCustomerChange(value);
            }}
          >
            {[...Array(RecurringEventsFrequencyMetadata[recurrenceFrequency].maxPriorDaysForEventCreation).keys()].map(
              (value, idx) => {
                value += 1;
                return (
                  <Option key={`maxPriorEventCreate-option-${idx}`} value={`${value}`}>
                    {`${value} days`}
                  </Option>
                );
              }
            )}
          </Select>
        </div>
      </div>
    </>
  );
};
