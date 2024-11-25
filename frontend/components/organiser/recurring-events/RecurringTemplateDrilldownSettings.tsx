import { MAX_RECURRENCE_AMOUNT } from "@/components/events/create/forms/RecurringEventsForm";
import LoadingSkeletonBig from "@/components/loading/LoadingSkeletonBig";
import { Frequency, NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { RecurringEventsFrequencyMetadata } from "@/services/src/recurringEvents/recurringEventsConstants";
import { calculateRecurrenceDates } from "@/services/src/recurringEvents/recurringEventsService";
import { Button, Radio, Switch } from "@mantine/core";
import { Option, Select, Spinner } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { RecurringEventsPreviewTable } from "../../events/create/forms/RecurringEventsPreviewTable";
interface RecurringTemplateDrilldownSettingsProps {
  loading: boolean;
  updating: boolean;
  startDate: Timestamp;
  newRecurrenceData: NewRecurrenceFormData;
  setNewRecurrenceData: (data: NewRecurrenceFormData) => void;
  submitNewRecurrenceData: () => void;
}

const RecurringTemplateDrilldownSettings = ({
  loading,
  updating,
  startDate,
  newRecurrenceData,
  setNewRecurrenceData,
  submitNewRecurrenceData,
}: RecurringTemplateDrilldownSettingsProps) => {
  const [recurrenceDates, setRecurrenceDates] = useState<Timestamp[]>([]);

  useEffect(() => {
    const timestamp = startDate;
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
    setNewRecurrenceData({
      ...newRecurrenceData,
      recurrenceEnabled: value,
    });
  };

  const handleRecurrenceFrequencyChange = (value: Frequency) => {
    setNewRecurrenceData({
      ...newRecurrenceData,
      frequency: value,
    });
  };

  const handleRecurrenceAmountChange = (value: string | undefined) => {
    setNewRecurrenceData({
      ...newRecurrenceData,
      recurrenceAmount: value === undefined ? 1 : parseInt(value),
    });
  };

  const handleCreateDaysBeforeChange = (value: string | undefined) => {
    setNewRecurrenceData({
      ...newRecurrenceData,
      createDaysBefore: value === undefined ? 1 : parseInt(value),
    });
  };

  return (
    <div className="bg-organiser-light-gray p-10 m-0 rounded-3xl flex justify-between flex-row space-x-6 max-w-6xl xl:mx-auto">
      {loading ? (
        <div>
          <LoadingSkeletonBig />
        </div>
      ) : (
        <div className="md:grid grid-cols-2 md:space-x-6 w-full">
          <div>
            <label className="text-black text-lg font-semibold">Recurrence Settings</label>
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
              <div className="h-full flex items-center">
                <div className="w-full">
                  <RecurringEventsPreviewTable recurrenceDates={recurrenceDates} />
                  <div className="flex w-full mt-6">
                    <Button variant="light" color="dark" className="ml-auto" onClick={submitNewRecurrenceData}>
                      {updating ? <Spinner /> : <>Save</>}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringTemplateDrilldownSettings;
