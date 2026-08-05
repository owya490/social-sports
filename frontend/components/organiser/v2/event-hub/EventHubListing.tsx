"use client";

import DescriptionRichTextEditor from "@/components/editor/DescriptionRichTextEditor";
import OrganiserEventDescription from "@/components/events/OrganiserEventDescription";
import { EventDetailsEdit } from "@/components/organiser/event/details/EventDetailsEdit";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import {
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import {
  CheckIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  EventHubGhostButton,
  EventHubMetaRow,
  EventHubPrimaryButton,
  EventHubStage,
} from "./EventHubStage";

type EventHubListingProps = {
  loading: boolean;
  eventId: EventId;
  eventName: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventSport: string;
  eventCapacity: number;
  eventVacancy: number;
  eventPrice: number;
  eventRegistrationDeadline: Timestamp;
  eventEventLink: string;
  isActive: boolean;
  eventFormId: FormId | null;
  updateData: (id: EventId, data: Partial<EventData>) => Promise<void>;
};

export function EventHubListing({
  loading,
  eventId,
  eventName,
  eventStartDate,
  eventEndDate,
  eventDescription,
  eventLocation,
  eventSport,
  eventCapacity,
  eventVacancy,
  eventPrice,
  eventRegistrationDeadline,
  eventEventLink,
  isActive,
  eventFormId,
  updateData,
}: EventHubListingProps) {
  const [name, setName] = useState(eventName);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(eventName);
  const [nameSaving, setNameSaving] = useState(false);

  const [description, setDescription] = useState(eventDescription);
  const [editingDescription, setEditingDescription] = useState(false);
  const [draftDescription, setDraftDescription] = useState(eventDescription);
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setName(eventName);
    setDraftName(eventName);
  }, [eventName]);

  useEffect(() => {
    setDescription(eventDescription);
    setDraftDescription(eventDescription);
  }, [eventDescription]);

  const saveName = async () => {
    setNameSaving(true);
    const next = draftName.trim();
    setName(next);
    setEditingName(false);
    try {
      await updateData(eventId, { name: next, nameTokens: next.toLowerCase().split(" ") });
    } catch {
      setName(eventName);
      setDraftName(eventName);
    } finally {
      setNameSaving(false);
    }
  };

  const saveDescription = async () => {
    setDescriptionSaving(true);
    setDescription(draftDescription);
    setEditingDescription(false);
    try {
      await updateData(eventId, { description: draftDescription });
    } catch {
      setDescription(eventDescription);
      setDraftDescription(eventDescription);
    } finally {
      setDescriptionSaving(false);
    }
  };

  const filled = Math.max(0, eventCapacity - eventVacancy);
  const whenLabel = loading
    ? ""
    : `${timestampToDateString(eventStartDate)} · ${timestampToTimeOfDay(eventStartDate)} – ${timestampToTimeOfDay(eventEndDate)}`;

  return (
    <EventHubStage>
      <div className="lg:flex lg:gap-10 lg:items-start">
        <div className="lg:flex-1 lg:min-w-0 space-y-5">
          <div>
            {loading ? (
              <Skeleton height={36} width="70%" />
            ) : editingName ? (
              <div className="flex items-start gap-2">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={100}
                  className="w-full text-2xl sm:text-3xl font-bold text-foreground font-sans tracking-tight leading-tight bg-transparent border-b border-border focus:border-focus outline-none py-0.5"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving}
                  className="p-1.5 rounded-lg text-foreground-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                  aria-label="Save name"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(name);
                    setEditingName(false);
                  }}
                  className="p-1.5 rounded-lg text-foreground-secondary hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                  aria-label="Cancel"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isActive}
                onClick={() => isActive && setEditingName(true)}
                className="w-full text-left group/title focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-lg"
              >
                <span className="text-2xl sm:text-3xl font-bold text-foreground font-sans tracking-tight leading-tight inline-flex items-start gap-2">
                  {name}
                  {isActive ? (
                    <PencilSquareIcon className="h-4 w-4 mt-2 text-foreground-muted opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                  ) : null}
                </span>
              </button>
            )}
          </div>

          <div>
            {loading ? (
              <Skeleton count={4} />
            ) : editingDescription ? (
              <div className="space-y-3">
                <DescriptionRichTextEditor
                  description={draftDescription}
                  updateDescription={setDraftDescription}
                />
                <div className="flex gap-2">
                  <EventHubPrimaryButton onClick={saveDescription} disabled={descriptionSaving}>
                    <CheckIcon className="h-4 w-4" aria-hidden />
                    Save description
                  </EventHubPrimaryButton>
                  <EventHubGhostButton
                    onClick={() => {
                      setDraftDescription(description);
                      setEditingDescription(false);
                    }}
                  >
                    Cancel
                  </EventHubGhostButton>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isActive}
                onClick={() => isActive && setEditingDescription(true)}
                className="w-full text-left group/desc focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-lg"
              >
                <div className="flex items-start justify-end gap-2 mb-1">
                  {isActive ? (
                    <PencilSquareIcon className="h-4 w-4 text-foreground-muted opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                  ) : null}
                </div>
                <div className="text-sm text-foreground-secondary font-sans leading-relaxed">
                  <OrganiserEventDescription description={description} />
                </div>
              </button>
            )}
          </div>
        </div>

        <aside className="lg:w-[20rem] xl:w-[22rem] shrink-0 mt-8 lg:mt-0 pt-6 lg:pt-0 border-t lg:border-t-0 border-border">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="py-4">
                <Skeleton count={4} />
              </div>
            ) : (
              <>
                <EventHubMetaRow label="When">{whenLabel}</EventHubMetaRow>
                <EventHubMetaRow label="Location">{eventLocation}</EventHubMetaRow>
                <EventHubMetaRow label="Price">{getEventPriceDisplay(eventPrice, true)}</EventHubMetaRow>
                <EventHubMetaRow label="Capacity">
                  <span className="tabular-nums">
                    {filled}/{eventCapacity}
                    {eventSport ? ` · ${eventSport}` : ""}
                  </span>
                </EventHubMetaRow>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-4 text-xs font-medium text-foreground-secondary font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus rounded"
          >
            {showAdvanced ? "Hide session fields" : "Edit session details"}
          </button>
        </aside>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {showAdvanced ? (
            <div className="pt-6 mt-4 border-t border-border">
              <EventDetailsEdit
                eventId={eventId}
                eventStartDate={eventStartDate}
                eventEndDate={eventEndDate}
                eventLocation={eventLocation}
                eventSport={eventSport}
                eventCapacity={eventCapacity}
                eventVacancy={eventVacancy}
                eventPrice={eventPrice}
                eventRegistrationDeadline={eventRegistrationDeadline}
                eventEventLink={eventEventLink}
                loading={loading}
                isActive={isActive}
                updateData={updateData}
                isRecurrenceTemplate={false}
                eventFormId={eventFormId}
              />
            </div>
          ) : null}
        </div>
      </div>
    </EventHubStage>
  );
}
