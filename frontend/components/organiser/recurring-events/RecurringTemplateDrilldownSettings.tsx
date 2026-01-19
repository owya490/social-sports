import { MAX_RECURRENCE_AMOUNT } from "@/components/events/create/forms/RecurringEventsForm";
import { ReservedSlotsForm } from "@/components/events/create/forms/ReservedSlotsForm";
import LoadingSkeletonBig from "@/components/loading/LoadingSkeletonBig";
import { Frequency, NewRecurrenceFormData, ReservedSlot } from "@/interfaces/RecurringEventTypes";
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
  originalRecurrenceData: NewRecurrenceFormData | null;
  setNewRecurrenceData: (data: NewRecurrenceFormData) => void;
  submitNewRecurrenceData: () => void;
  isRecurrenceEnded: boolean;
  capacity?: number;
}

const RecurringTemplateDrilldownSettings = ({
  loading,
  updating,
  startDate,
  newRecurrenceData,
  originalRecurrenceData,
  setNewRecurrenceData,
  submitNewRecurrenceData,
  isRecurrenceEnded,
  capacity,
}: RecurringTemplateDrilldownSettingsProps) => {
  const [recurrenceDates, setRecurrenceDates] = useState<Timestamp[]>([]);

  // Check if any changes have been made
  const hasChanges = (): boolean => {
    if (!originalRecurrenceData) return true; // Allow save if no original data (new creation)
    
    if (newRecurrenceData.frequency !== originalRecurrenceData.frequency) return true;
    if (newRecurrenceData.recurrenceAmount !== originalRecurrenceData.recurrenceAmount) return true;
    if (newRecurrenceData.createDaysBefore !== originalRecurrenceData.createDaysBefore) return true;
    if (newRecurrenceData.recurrenceEnabled !== originalRecurrenceData.recurrenceEnabled) return true;
    
    // Compare reserved slots
    const currentSlots = newRecurrenceData.reservedSlots || [];
    const originalSlots = originalRecurrenceData.reservedSlots || [];
    
    if (currentSlots.length !== originalSlots.length) return true;
    
    for (let i = 0; i < currentSlots.length; i++) {
      const currentSlot = currentSlots[i];
      const originalSlot = originalSlots.find(
        (s) => s.email === currentSlot.email && s.name === currentSlot.name
      );
      if (!originalSlot || currentSlot.slots !== originalSlot.slots) {
        return true;
      }
    }
    
    return false;
  };

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

  const handleReservedSlotsChange = (slots: ReservedSlot[]) => {
    setNewRecurrenceData({
      ...newRecurrenceData,
      reservedSlots: slots,
    });
  };

  return (
    <div className="space-y-6">
      {/* Recurrence Settings Section */}
      <div className="bg-organiser-light-gray p-6 sm:p-10 rounded-3xl">
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
                label={`${isRecurrenceEnded ? "Re-enable" : "Enable"} Recurrence for this Event`}
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
              <div className="h-full flex items-center">
                <div className="w-full">
                  {newRecurrenceData.recurrenceEnabled && (
                    <RecurringEventsPreviewTable recurrenceDates={recurrenceDates} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reserved Slots Section */}
      {!loading && (
        <div className="bg-organiser-light-gray p-6 sm:p-10 rounded-3xl">
          <ReservedSlotsForm
            reservedSlots={newRecurrenceData.reservedSlots || []}
            setReservedSlots={handleReservedSlotsChange}
            maxCapacity={capacity}
          />
        </div>
      )}

      {/* Save Button */}
      {!loading && (
        <div className="flex w-full">
          <Button
            variant="light"
            color="dark"
            className="ml-auto"
            onClick={submitNewRecurrenceData}
            disabled={!hasChanges() || updating}
          >
            {updating ? <Spinner /> : <>Save</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecurringTemplateDrilldownSettings;
