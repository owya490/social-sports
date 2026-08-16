"use client";

import { RecurringEventsForm } from "@/components/events/create/forms/RecurringEventsForm";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { useState } from "react";

type CreateEventRecurrenceModalProps = {
  open: boolean;
  onClose: () => void;
  startDate: string;
  value: NewRecurrenceFormData;
  onSave: (data: NewRecurrenceFormData) => void;
  onCancelEnable: () => void;
};

type BodyProps = {
  startDate: string;
  initial: NewRecurrenceFormData;
  onSave: (data: NewRecurrenceFormData) => void;
  onClose: () => void;
  onCancelEnable: () => void;
};

function RecurrencePanelBody({ startDate, initial, onSave, onClose, onCancelEnable }: BodyProps) {
  const [draft, setDraft] = useState<NewRecurrenceFormData>(initial);

  const handleClose = () => {
    onCancelEnable();
    onClose();
  };

  const handleSave = () => {
    onSave({ ...draft, recurrenceEnabled: true });
    onClose();
  };

  return (
    <>
      <p className="text-sm text-foreground-muted font-sans mb-4 leading-relaxed">
        Choose how often this event repeats. Later occurrences are created automatically from this template.
      </p>
      <RecurringEventsForm
        startDate={startDate}
        newRecurrenceData={draft}
        setRecurrenceData={setDraft}
        hideEnableSwitch
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
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background font-sans hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
          initial={{ ...value, recurrenceEnabled: true }}
          onSave={onSave}
          onClose={onClose}
          onCancelEnable={onCancelEnable}
        />
      ) : null}
    </EventHubPanel>
  );
}
