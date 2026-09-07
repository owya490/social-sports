"use client";

import { RecurrenceCalendarEditor } from "@/components/events/create/recurrence-v2/RecurrenceCalendarEditor";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { useState } from "react";

type CreateEventRecurrenceModalProps = {
  open: boolean;
  onClose: () => void;
  startDate: string;
  startTime: string;
  value: NewRecurrenceFormData;
  onSave: (data: NewRecurrenceFormData) => void;
  onCancelEnable: () => void;
};

type BodyProps = {
  startDate: string;
  startTime: string;
  initial: NewRecurrenceFormData;
  onSave: (data: NewRecurrenceFormData) => void;
  onClose: () => void;
  onCancelEnable: () => void;
};

function RecurrencePanelBody({ startDate, startTime, initial, onSave, onClose, onCancelEnable }: BodyProps) {
  const [draft, setDraft] = useState<NewRecurrenceFormData>(initial);
  const canSave = (draft.occurrences ?? []).length > 0;

  const handleClose = () => {
    onCancelEnable();
    onClose();
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave({ ...draft, recurrenceEnabled: true });
    onClose();
  };

  return (
    <>
      <RecurrenceCalendarEditor
        startDateYmd={startDate}
        startTimeHm={startTime}
        value={draft}
        onChange={setDraft}
      />
      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background font-sans hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Save recurrence
        </button>
      </div>
    </>
  );
}

/**
 * Configure recurrence from create. Uses EventHubPanel (right drawer / bottom sheet).
 * Cancel restores the pre-open snapshot (and may clear enable if it was newly toggled).
 */
export function CreateEventRecurrenceModal({
  open,
  onClose,
  startDate,
  startTime,
  value,
  onSave,
  onCancelEnable,
}: CreateEventRecurrenceModalProps) {
  const handleDismiss = () => {
    onCancelEnable();
    onClose();
  };

  return (
    <EventHubPanel open={open} onClose={handleDismiss} title="Recurring event" wide>
      {open ? (
        <RecurrencePanelBody
          startDate={startDate}
          startTime={startTime}
          initial={{ ...value, recurrenceEnabled: true }}
          onSave={onSave}
          onClose={onClose}
          onCancelEnable={onCancelEnable}
        />
      ) : null}
    </EventHubPanel>
  );
}
