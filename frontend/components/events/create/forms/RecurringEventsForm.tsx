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
  /** When true, skip the enable switch — parent owns enabling (e.g. create modal). */
  hideEnableSwitch?: boolean;
}

export const RecurringEventsForm = ({
  startDate,
  newRecurrenceData,
  setRecurrenceData,
  hideEnableSwitch = false,
}: RecurringEventsFormProps) => {
  const [recurrenceDates, setRecurrenceDates] = useState<Timestamp[]>([]);

  useEffect(() => {
    const dateObject = new Date(startDate);
    const timestamp = Timestamp.fromDate(dateObject);
    const futureRecurrences: Timestamp[] = calculateRecurrenceDates(newRecurrenceData, timestamp);
    setRecurrenceDates(futureRecurrences);
  }, [startDate, newRecurrenceData.frequency, newRecurrenceData.recurrenceAmount]);

  useEffect(() => {
    const maxCreateDaysBefore =
      RecurringEventsFrequencyMetadata[newRecurrenceData.frequency].maxPriorDaysForEventCreation;

    if (newRecurrenceData.createDaysBefore > maxCreateDaysBefore) {
      setRecurrenceData({
        ...newRecurrenceData,
        createDaysBefore: maxCreateDaysBefore,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clamp when frequency changes only
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

  const showConfig = hideEnableSwitch || newRecurrenceData.recurrenceEnabled;

  const clubhouseSelectClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  const clubhouseConfig = showConfig && hideEnableSwitch && (
    <div className="space-y-4 mt-4">
      <fieldset>
        <legend className="text-xs font-medium text-foreground-muted font-sans mb-2">Frequency</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: Frequency.WEEKLY, label: "Weekly" },
            { value: Frequency.FORTNIGHTLY, label: "Fortnightly" },
            { value: Frequency.MONTHLY, label: "Monthly" },
          ].map((opt) => {
            const active = newRecurrenceData.frequency === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRecurrenceFrequencyChange(opt.value)}
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  active
                    ? "border-foreground bg-surface-muted text-foreground"
                    : "border-border bg-background text-foreground-secondary hover:bg-surface-hover"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label htmlFor="recurrence-amount" className="block text-xs font-medium text-foreground-muted font-sans mb-1.5">
          Number of recurrences
        </label>
        <select
          id="recurrence-amount"
          className={clubhouseSelectClass}
          value={newRecurrenceData.recurrenceAmount.toString()}
          onChange={(e) => handleRecurrenceAmountChange(e.target.value)}
        >
          {[...Array(MAX_RECURRENCE_AMOUNT).keys()].map((value, idx) => {
            value += 1;
            return (
              <option key={`numberOfRecurrence-option-${idx}`} value={`${value}`}>
                {value == 1 ? "Once" : `${value} times`}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <label
          htmlFor="recurrence-days-before"
          className="block text-xs font-medium text-foreground-muted font-sans mb-1.5"
        >
          Days prior for event creation
        </label>
        <select
          id="recurrence-days-before"
          className={clubhouseSelectClass}
          value={newRecurrenceData.createDaysBefore.toString()}
          onChange={(e) => handleCreateDaysBeforeChange(e.target.value)}
        >
          {[
            ...Array(
              RecurringEventsFrequencyMetadata[newRecurrenceData.frequency].maxPriorDaysForEventCreation
            ).keys(),
          ].map((value, idx) => {
            value += 1;
            return (
              <option key={`maxPriorEventCreate-option-${idx}`} value={`${value}`}>
                {`${value} days`}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:grid grid-cols-2 md:space-x-6">
        <div>
          {!hideEnableSwitch ? (
            <>
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
            </>
          ) : (
            <label className="text-foreground text-base font-semibold font-sans">Recurrence settings</label>
          )}
          {hideEnableSwitch ? (
            clubhouseConfig
          ) : (
            showConfig && (
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
                              ...Array(RecurringEventsFrequencyMetadata[frequency].maxPriorDaysForEventCreation)
                                .keys(),
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
            )
          )}
        </div>
        <div>
          {showConfig && (
            <div className="flex items-center h-full">
              <RecurringEventsPreviewTable recurrenceDates={recurrenceDates} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
