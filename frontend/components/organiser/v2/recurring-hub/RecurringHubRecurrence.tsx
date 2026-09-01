"use client";

import { MAX_RECURRENCE_AMOUNT } from "@/components/events/create/forms/RecurringEventsForm";
import { ReservedSlotsForm } from "@/components/events/create/forms/ReservedSlotsForm";
import {
  EventHubEmpty,
  EventHubPreferenceRow,
  EventHubPrimaryButton,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { Frequency, NewRecurrenceFormData, ReservedSlot } from "@/interfaces/RecurringEventTypes";
import { RecurringEventsFrequencyMetadata } from "@/services/src/recurringEvents/recurringEventsConstants";
import { calculateRecurrenceDates } from "@/services/src/recurringEvents/recurringEventsService";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { Fragment, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

type RecurringHubRecurrenceProps = {
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

function hasRecurrenceChanges(
  current: NewRecurrenceFormData,
  original: NewRecurrenceFormData | null
): boolean {
  if (!original) return true;
  if (current.frequency !== original.frequency) return true;
  if (current.recurrenceAmount !== original.recurrenceAmount) return true;
  if (current.createDaysBefore !== original.createDaysBefore) return true;
  if (current.recurrenceEnabled !== original.recurrenceEnabled) return true;

  const currentSlots = current.reservedSlots || [];
  const originalSlots = original.reservedSlots || [];
  if (currentSlots.length !== originalSlots.length) return true;

  for (const slot of currentSlots) {
    const match = originalSlots.find((s) => s.email === slot.email && s.name === slot.name);
    if (!match || match.slots !== slot.slots) return true;
  }
  return false;
}

function formatRecurrenceDate(date: Timestamp) {
  return date.toDate().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RecurringHubRecurrence({
  loading,
  updating,
  startDate,
  newRecurrenceData,
  originalRecurrenceData,
  setNewRecurrenceData,
  submitNewRecurrenceData,
  isRecurrenceEnded,
  capacity,
}: RecurringHubRecurrenceProps) {
  const [recurrenceDates, setRecurrenceDates] = useState<Timestamp[]>([]);
  const dirty = hasRecurrenceChanges(newRecurrenceData, originalRecurrenceData);
  const maxCreateDays =
    RecurringEventsFrequencyMetadata[newRecurrenceData.frequency].maxPriorDaysForEventCreation;
  const recurrenceEnabled = newRecurrenceData.recurrenceEnabled;

  useEffect(() => {
    setRecurrenceDates(calculateRecurrenceDates(newRecurrenceData, startDate));
  }, [startDate, newRecurrenceData.frequency, newRecurrenceData.recurrenceAmount]);

  useEffect(() => {
    if (newRecurrenceData.createDaysBefore > maxCreateDays) {
      setNewRecurrenceData({
        ...newRecurrenceData,
        createDaysBefore: maxCreateDays,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only clamp when frequency/max changes
  }, [newRecurrenceData.frequency, maxCreateDays]);

  if (loading) {
    return (
      <EventHubStage className="space-y-4">
        <Skeleton height={28} width={180} />
        <Skeleton count={4} />
      </EventHubStage>
    );
  }

  return (
    <EventHubStage className="space-y-8">
      <div
        className={
          recurrenceEnabled
            ? "grid gap-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border lg:rounded-xl lg:border lg:border-border lg:bg-background lg:overflow-hidden"
            : undefined
        }
      >
        <section className={recurrenceEnabled ? "lg:p-5 min-w-0" : undefined}>
          <h3 className="text-sm font-semibold text-foreground font-sans mb-1">Schedule</h3>
          <div className="divide-y divide-border border-t border-border">
            <EventHubPreferenceRow
              title={isRecurrenceEnded ? "Re-enable recurrence" : "Enable recurrence"}
              description={
                isRecurrenceEnded
                  ? "This series has ended. Re-enable to resume creating occurrences."
                  : "When on, SPORTSHUB creates the next occurrence from this template."
              }
              checked={newRecurrenceData.recurrenceEnabled}
              onChange={(next) => setNewRecurrenceData({ ...newRecurrenceData, recurrenceEnabled: next })}
            />

            {recurrenceEnabled ? (
              <>
                <div className="py-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground font-sans">Frequency</p>
                    <p className="mt-1 text-xs text-foreground-muted font-sans">
                      How often a new occurrence is scheduled.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Recurrence frequency">
                    {[
                      { value: Frequency.WEEKLY, label: "Weekly" },
                      { value: Frequency.FORTNIGHTLY, label: "Fortnightly" },
                      { value: Frequency.MONTHLY, label: "Monthly" },
                    ].map((option) => {
                      const active = newRecurrenceData.frequency === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() =>
                            setNewRecurrenceData({ ...newRecurrenceData, frequency: option.value })
                          }
                          className={`rounded-xl border px-3 py-2 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground font-sans">Number of recurrences</p>
                    <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
                      How many more times this template should create an event.
                    </p>
                  </div>
                  <Listbox
                      value={newRecurrenceData.recurrenceAmount}
                      onChange={(recurrenceAmount) =>
                        setNewRecurrenceData({
                          ...newRecurrenceData,
                          recurrenceAmount,
                        })
                      }
                    >
                    <div className="relative min-w-[10rem] shrink-0">
                      <Listbox.Button
                        aria-label="Number of recurrences"
                        className="relative w-full rounded-xl border border-border bg-background py-2 pl-3 pr-10 text-left text-sm font-medium text-foreground font-sans focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {newRecurrenceData.recurrenceAmount === 1
                          ? "Once"
                          : `${newRecurrenceData.recurrenceAmount} times`}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronUpDownIcon className="h-4 w-4 text-foreground-muted" aria-hidden />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute right-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-background py-1 text-sm shadow-sm focus:outline-none">
                          {[...Array(MAX_RECURRENCE_AMOUNT).keys()].map((value) => {
                            const n = value + 1;
                            return (
                              <Listbox.Option
                                key={n}
                                value={n}
                                className={({ active }) =>
                                  `cursor-default px-3 py-2 font-sans ${
                                    active ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                                  }`
                                }
                              >
                                {n === 1 ? "Once" : `${n} times`}
                              </Listbox.Option>
                            );
                          })}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground font-sans">Create days before</p>
                    <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
                      How many days before the occurrence date the public event is created.
                    </p>
                  </div>
                  <Listbox
                      value={newRecurrenceData.createDaysBefore}
                      onChange={(createDaysBefore) =>
                        setNewRecurrenceData({
                          ...newRecurrenceData,
                          createDaysBefore,
                        })
                      }
                    >
                    <div className="relative min-w-[10rem] shrink-0">
                      <Listbox.Button
                        aria-label="Create days before"
                        className="relative w-full rounded-xl border border-border bg-background py-2 pl-3 pr-10 text-left text-sm font-medium text-foreground font-sans focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {newRecurrenceData.createDaysBefore} {newRecurrenceData.createDaysBefore === 1 ? "day" : "days"}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronUpDownIcon className="h-4 w-4 text-foreground-muted" aria-hidden />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute right-0 z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-background py-1 text-sm shadow-sm focus:outline-none">
                          {[...Array(maxCreateDays).keys()].map((value) => {
                            const n = value + 1;
                            return (
                              <Listbox.Option
                                key={n}
                                value={n}
                                className={({ active }) =>
                                  `cursor-default px-3 py-2 font-sans ${
                                    active ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                                  }`
                                }
                              >
                                {n} {n === 1 ? "day" : "days"}
                              </Listbox.Option>
                            );
                          })}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {recurrenceEnabled ? (
          <section className="min-w-0 lg:p-5 lg:flex lg:flex-col">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-foreground font-sans">Upcoming dates</h3>
              {recurrenceDates.length > 0 ? (
                <p className="text-xs text-foreground-muted font-sans tabular-nums">
                  {recurrenceDates.length} {recurrenceDates.length === 1 ? "date" : "dates"}
                </p>
              ) : null}
            </div>
            {recurrenceDates.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden lg:rounded-none lg:border-0 lg:flex-1 lg:min-h-0">
                <ul
                  className="max-h-[28rem] overflow-y-auto divide-y divide-border border-t border-border"
                  role="list"
                >
                  {recurrenceDates.map((date, index) => (
                    <li
                      key={`${date.toMillis()}-${index}`}
                      className="flex items-center gap-3 px-3.5 py-2.5 lg:px-0"
                    >
                      <span className="w-7 shrink-0 text-xs tabular-nums text-foreground-muted font-sans">
                        {index + 1}
                      </span>
                      <span className="min-w-0 text-sm text-foreground font-sans">
                        {formatRecurrenceDate(date)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EventHubEmpty>No upcoming dates for this schedule yet.</EventHubEmpty>
            )}
          </section>
        ) : null}
      </div>

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
