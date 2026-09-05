"use client";

import { RecurrenceCalendarEditor } from "@/components/events/create/recurrence-v2/RecurrenceCalendarEditor";
import { ReservedSlotsForm } from "@/components/events/create/forms/ReservedSlotsForm";
import {
  EventHubEmpty,
  EventHubPreferenceRow,
  EventHubPrimaryButton,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { NewRecurrenceFormData, ReservedSlot } from "@/interfaces/RecurringEventTypes";
import { ymdFromLocalTimestamp } from "@/services/src/recurringEvents/recurrenceV2Utils";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Skeleton from "react-loading-skeleton";

type RecurringHubRecurrenceV2Props = {
  loading: boolean;
  updating: boolean;
  startDate: Timestamp;
  newRecurrenceData: NewRecurrenceFormData;
  originalRecurrenceData: NewRecurrenceFormData | null;
  setNewRecurrenceData: (data: NewRecurrenceFormData) => void;
  submitNewRecurrenceData: () => void;
  isRecurrenceEnded: boolean;
  capacity?: number;
};

function hasRecurrenceV2Changes(
  current: NewRecurrenceFormData,
  original: NewRecurrenceFormData | null
): boolean {
  if (!original) return false;
  return JSON.stringify({
    recurrenceEnabled: current.recurrenceEnabled,
    reservedSlots: current.reservedSlots ?? [],
    occurrences: (current.occurrences ?? []).map((occurrence) => ({
      occurrenceId: occurrence.occurrenceId,
      eventStart: occurrence.eventStart.toMillis(),
      createDate: occurrence.createDate.toMillis(),
      eventId: occurrence.eventId ?? null,
    })),
  }) !== JSON.stringify({
    recurrenceEnabled: original.recurrenceEnabled,
    reservedSlots: original.reservedSlots ?? [],
    occurrences: (original.occurrences ?? []).map((occurrence) => ({
      occurrenceId: occurrence.occurrenceId,
      eventStart: occurrence.eventStart.toMillis(),
      createDate: occurrence.createDate.toMillis(),
      eventId: occurrence.eventId ?? null,
    })),
  });
}

export function RecurringHubRecurrenceV2({
  loading,
  updating,
  startDate,
  newRecurrenceData,
  originalRecurrenceData,
  setNewRecurrenceData,
  submitNewRecurrenceData,
  isRecurrenceEnded,
  capacity,
}: RecurringHubRecurrenceV2Props) {
  const dirty = hasRecurrenceV2Changes(newRecurrenceData, originalRecurrenceData);
  const startDateYmd = ymdFromLocalTimestamp(startDate);
  const startTimeHm = `${String(startDate.toDate().getHours()).padStart(2, "0")}:${String(
    startDate.toDate().getMinutes()
  ).padStart(2, "0")}`;

  if (loading) {
    return (
      <EventHubStage>
        <Skeleton height={28} width="40%" />
        <Skeleton height={320} className="mt-4" />
      </EventHubStage>
    );
  }

  if (isRecurrenceEnded) {
    return (
      <EventHubStage>
        <EventHubEmpty>This series has ended. Upcoming dates can no longer be scheduled.</EventHubEmpty>
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      <EventHubPreferenceRow
        title="Enable recurrence"
        description="When on, pending dates are created on their create day."
        checked={newRecurrenceData.recurrenceEnabled}
        onChange={(next) => setNewRecurrenceData({ ...newRecurrenceData, recurrenceEnabled: next })}
      />

      {newRecurrenceData.recurrenceEnabled ? (
        <RecurrenceCalendarEditor
          startDateYmd={startDateYmd}
          startTimeHm={startTimeHm}
          value={newRecurrenceData}
          onChange={setNewRecurrenceData}
        />
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-foreground font-sans mb-3">Reserved slots</h3>
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <ReservedSlotsForm
            reservedSlots={newRecurrenceData.reservedSlots || []}
            setReservedSlots={(slots: ReservedSlot[]) =>
              setNewRecurrenceData({ ...newRecurrenceData, reservedSlots: slots })
            }
            maxCapacity={capacity}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <EventHubPrimaryButton onClick={submitNewRecurrenceData} disabled={!dirty || updating}>
          <CheckIcon className="h-4 w-4" aria-hidden />
          {updating ? "Saving…" : "Save recurrence"}
        </EventHubPrimaryButton>
      </div>
    </EventHubStage>
  );
}
