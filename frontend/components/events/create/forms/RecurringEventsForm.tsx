import { Frequency, NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { RecurringEventsFrequencyMetadata } from "@/services/src/recurringEvents/recurringEventsConstants";
import { calculateRecurrenceDates } from "@/services/src/recurringEvents/recurringEventsService";
import { Radio, Switch } from "@mantine/core";
import { Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { RecurringEventsPreviewTable } from "./RecurringEventsPreviewTable";
import "./form.css";

export const MAX_RECURRENCE_AMOUNT = 99;

interface RecurringEventsFormProps {
  startDate: string;
  newRecurrenceData: NewRecurrenceFormData;
  setRecurrenceData: (data: NewRecurrenceFormData) => void;
}

export const RecurringEventsForm = ({ startDate, newRecurrenceData, setRecurrenceData }: RecurringEventsFormProps) => {
  const [recurrenceDates, setRecurrenceDates] = useState<Timestamp[]>([]);

  useEffect(() => {
    let dateObject = new Date(startDate);
    const timestamp = Timestamp.fromDate(dateObject);
    const futureRecurrences: Timestamp[] = calculateRecurrenceDates(newRecurrenceData, timestamp);
    setRecurrenceDates(futureRecurrences);
  }, [startDate, newRecurrenceData.frequency, newRecurrenceData.recurrenceAmount]);

  useEffect(() => {
    const maxCreateDaysBefore =
      RecurringEventsFrequencyMetadata[newRecurrenceData.frequency].maxPriorDaysForEventCreation;

    if (newRecurrenceData.createDaysBefore > maxCreateDaysBefore) {
      handleCreateDaysBeforeChange(maxCreateDaysBefore.toString());
    }
  }, [newRecurrenceData.frequency]);

  const handleRecurrenceEnabledChange = (value: boolean) => {
    setRecurrenceData({
      ...newRecurrenceData,
      recurrenceEnabled: value,
    });
  };

  const handleRecurrenceFrequencyChange = (value: Frequency) => {
    setRecurrenceData({
      ...newRecurrenceData,
      frequency: value,
    });
  };

  const handleRecurrenceAmountChange = (value: string | undefined) => {
    setRecurrenceData({
      ...newRecurrenceData,
      recurrenceAmount: value === undefined ? 1 : parseInt(value),
    });
  };

  const handleCreateDaysBeforeChange = (value: string | undefined) => {
    setRecurrenceData({
      ...newRecurrenceData,
      createDaysBefore: value === undefined ? 1 : parseInt(value),
    });
  };

  return (
    <>
      <div className="md:grid grid-cols-2 md:space-x-6">
        <div>
          <label className="text-black text-lg font-semibold">Recurring Events</label>
          <Switch
            color="teal"
            label="Enable Recurrence for this Event"
            size="sm"
            className="my-4"
            checked={newRecurrenceData.recurrenceEnabled}
            onChange={(event) => {
              handleRecurrenceEnabledChange(event.currentTarget.checked);
            }}
          />
          {newRecurrenceData.recurrenceEnabled && (
            <>
              {/* Styled in ./form.css to make it black and no ring border on focus */}
              <Radio.Group
                value={newRecurrenceData.frequency}
                onChange={handleRecurrenceFrequencyChange}
                name="recurrenceFrequency"
                label="Select your Recurrence Frequency"
                description="This is how frequent your event will be re-created."
                withAsterisk
                color="dark"
              >
                <Radio value={Frequency.WEEKLY} label="Weekly" color="dark" variant="outline" />
                <Radio value={Frequency.FORTNIGHTLY} label="Fortnightly" color="dark" variant="outline" />
                <Radio value={Frequency.MONTHLY} label="Monthly" color="dark" variant="outline" />
              </Radio.Group>
              <div className="my-4" id="recurrenceSelectors">
                <Select
                  size="md"
                  label="Number of recurrences?"
                  value={newRecurrenceData.recurrenceAmount.toString()}
                  onChange={handleRecurrenceAmountChange}
                >
                  {[...Array(MAX_RECURRENCE_AMOUNT).keys()].map((value, idx) => {
                    value += 1;
                    return (
                      <Option key={`numberOfRecurrence-option-${idx}`} value={`${value}`}>
                        {value == 1 ? "Once" : `${value} times`}
                      </Option>
                    );
                  })}
                </Select>
              </div>

              {
                // Every Frequency has its own select as dynamically changing Option(s) leads to unintended behaviour whilst selecting
                [Frequency.WEEKLY, Frequency.FORTNIGHTLY, Frequency.MONTHLY].map((frequency, idx) => {
                  return (
                    newRecurrenceData.frequency === frequency && (
                      <div className="my-4" id="recurrenceSelectors" key={`createDaysBefore-${idx}`}>
                        <Select
                          size="md"
                          label="Number of days prior for event creation?"
                          value={newRecurrenceData.createDaysBefore.toString()}
                          onChange={handleCreateDaysBeforeChange}
                        >
                          {[
                            ...Array(RecurringEventsFrequencyMetadata[frequency].maxPriorDaysForEventCreation).keys(),
                          ].map((value, idx) => {
                            value += 1;
                            return (
                              <Option key={`maxPriorEventCreate-option-${idx}`} value={`${value}`}>
                                {`${value} days`}
                              </Option>
                            );
                          })}
                        </Select>
                      </div>
                    )
                  );
                })
              }
            </>
          )}
        </div>
        <div>
          {newRecurrenceData.recurrenceEnabled && (
            <div className="flex items-center h-full">
              <RecurringEventsPreviewTable recurrenceDates={recurrenceDates} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
