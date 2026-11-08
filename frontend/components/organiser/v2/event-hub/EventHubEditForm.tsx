"use client";

import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { getLocationCoordinates, initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { LinkIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { EventHubDescriptionEditor } from "./EventHubDescriptionEditor";
import { getEventDetailsChanges, type EventDetailsDraft } from "./eventDetailsDraft";
import {
  EventHubFieldWithIcon as FieldWithIcon,
  EventHubScheduleFields,
  eventHubFieldClass as fieldClass,
  type EventHubScheduleValue,
} from "./EventHubScheduleFields";

const FORM_ID = "event-hub-edit-details";

type SportId = (typeof SPORTS_CONFIG)[keyof typeof SPORTS_CONFIG]["value"];

export { FORM_ID as EVENT_HUB_EDIT_FORM_ID };

type EventHubEditFormProps = {
  eventId: EventId;
  eventName: string;
  eventDescription: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventLocation: string;
  eventSport: string;
  eventRegistrationDeadline: Timestamp;
  eventEventLink: string;
  isActive: boolean;
  /** When true, details stay view-only because the event end time has passed. */
  ended?: boolean;
  updateData: (id: EventId, data: Partial<EventData>) => Promise<void>;
  onSaved: () => void;
  onStateChange: (state: { dirty: boolean; saving: boolean; canSave: boolean }) => void;
};

export function EventHubEditForm({
  eventId,
  eventName,
  eventDescription,
  eventStartDate,
  eventEndDate,
  eventLocation,
  eventSport,
  eventRegistrationDeadline,
  eventEventLink,
  isActive,
  ended = false,
  updateData,
  onSaved,
  onStateChange,
}: EventHubEditFormProps) {
  // Live event updates must not replace the draft while this editor is open.
  const [initialValues] = useState<EventDetailsDraft>({
    name: eventName,
    description: eventDescription,
    location: eventLocation,
    sport: eventSport,
    eventLink: eventEventLink ?? "",
    startDate: eventStartDate,
    endDate: eventEndDate,
    registrationDeadline: eventRegistrationDeadline,
  });
  const [name, setName] = useState(eventName);
  const [description, setDescription] = useState(eventDescription);

  const [location, setLocation] = useState(eventLocation);
  const [locationLatLng, setLocationLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [selectionMade, setSelectionMade] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [sport, setSport] = useState(eventSport);
  const [eventLink, setEventLink] = useState(eventEventLink ?? "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [schedule, setSchedule] = useState<EventHubScheduleValue | null>(null);

  const readOnly = !isActive || ended;
  const changes = getEventDetailsChanges(initialValues, {
    name, description, location, sport, eventLink,
    startDate: schedule?.startDate ?? initialValues.startDate,
    endDate: schedule?.endDate ?? initialValues.endDate,
    registrationDeadline: schedule?.registrationDeadline ?? initialValues.registrationDeadline,
  });
  const dirty = Object.keys(changes).length > 0;
  const canSave = dirty && !readOnly && !saving && Boolean(schedule && !schedule.hasBlockingWarning) && !locationError;

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const scriptLoadResult = useGoogleMapsScript();
  const isLoaded = scriptLoadResult ? scriptLoadResult.isLoaded : false;
  const loadError = scriptLoadResult ? scriptLoadResult.loadError : undefined;

  useEffect(() => {
    if (readOnly || !isLoaded || !locationInputRef.current) return;
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }
    autocompleteRef.current = initializeAutocomplete({ current: locationInputRef.current }, handlePlaceSelect);
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [readOnly, isLoaded]);

  useEffect(() => {
    onStateChange({ dirty, saving, canSave });
  }, [dirty, saving, canSave, onStateChange]);

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.name && place.formatted_address && place.geometry?.location) {
      setSelectionMade(true);
      const fullAddress = `${place.name}, ${place.formatted_address}`;
      setLocation(fullAddress);
      setLocationError("");
      setLocationLatLng({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly || saving || !dirty || !schedule || schedule.hasBlockingWarning) return;

    if (changes.location !== undefined && !selectionMade && location.trim() !== "") {
      setLocationError("Please select a location from the dropdown");
      return;
    }
    if (location.trim() === "") {
      setLocationError("Location is required");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      if (changes.location !== undefined) {
        changes.locationLatLng = locationLatLng ?? await getLocationCoordinates(location);
      }
      await updateData(eventId, changes);

      onSaved();
    } catch {
      setSaveError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} aria-busy={saving}>
      <fieldset disabled={saving} className="min-w-0 space-y-8">
        {saveError ? <p role="alert" className="text-sm text-danger font-sans">{saveError}</p> : null}
        {readOnly ? (
          <p className="text-sm text-foreground-secondary font-sans">
            {ended
              ? "This event has ended, so its details can't be changed."
              : "These details are view-only. You can copy text, but changes can't be saved."}
          </p>
        ) : null}
        <Section label="Basic Info">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            readOnly={readOnly}
            aria-label="Event title"
            placeholder="Event title"
            className="w-full border-0 border-b border-border bg-transparent px-0 py-2 text-xl font-semibold tracking-tight text-foreground font-sans placeholder:text-foreground-muted focus:border-focus focus:outline-none focus-visible:outline-none read-only:cursor-text"
          />
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground-muted font-sans">Description</span>
            </div>
            <EventHubDescriptionEditor
              description={description}
              updateDescription={setDescription}
              editable={!readOnly && !saving}
            />
          </div>
        </Section>

        <EventHubScheduleFields
          eventStartDate={initialValues.startDate}
          eventEndDate={initialValues.endDate}
          eventRegistrationDeadline={initialValues.registrationDeadline}
          readOnly={readOnly || saving}
          onChange={setSchedule}
        />

        <Section label="Location">
          {!readOnly && loadError ? <Warning>Error loading maps</Warning> : null}
          <FieldWithIcon icon={<MapPinIcon className="h-4 w-4" aria-hidden />}>
            <input
              ref={locationInputRef}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setLocationLatLng(null);
                setSelectionMade(false);
                setLocationError("");
              }}
              onBlur={() => {
                if (readOnly) return;
                if (location !== initialValues.location && !selectionMade && location.trim() !== "") {
                  setLocationError("Please select a location from the dropdown");
                }
              }}
              placeholder={isLoaded ? "What’s the address?" : "Loading maps…"}
              disabled={!readOnly && !isLoaded && !loadError}
              readOnly={readOnly}
              className={fieldClass}
              aria-label="Event location"
            />
          </FieldWithIcon>
          {!readOnly && locationError ? <Warning>{locationError}</Warning> : null}
        </Section>

        <Section label="Sport & Link">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-foreground-muted font-sans">Sport</span>
              <FieldWithIcon
                icon={
                  SPORTS_CONFIG[sport]?.iconImage ? (
                    <Image
                      src={SPORTS_CONFIG[sport].iconImage}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain opacity-70"
                    />
                  ) : (
                    <StarIcon className="h-4 w-4" aria-hidden />
                  )
                }
              >
                {readOnly ? (
                  <input
                    readOnly
                    value={SPORTS_CONFIG[sport]?.name ?? sport}
                    className={fieldClass}
                    aria-label="Sport"
                  />
                ) : (
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportId)}
                    className={fieldClass}
                    aria-label="Sport"
                  >
                    {Object.entries(SPORTS_CONFIG).map(([, sportInfo]) => (
                      <option key={sportInfo.value} value={sportInfo.value}>
                        {sportInfo.name}
                      </option>
                    ))}
                  </select>
                )}
              </FieldWithIcon>
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-foreground-muted font-sans">Event link</span>
              <FieldWithIcon icon={<LinkIcon className="h-4 w-4" aria-hidden />}>
                <input
                  value={eventLink ?? ""}
                  onChange={(e) => setEventLink(e.target.value)}
                  placeholder="https://"
                  readOnly={readOnly}
                  className={fieldClass}
                />
              </FieldWithIcon>
            </label>
          </div>
        </Section>

        {/* Hidden submit enables Enter-to-save; real CTA is the panel footer button */}
        <button type="submit" hidden disabled={!canSave}>
          Save details
        </button>
      </fieldset>
    </form>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted font-sans">{label}</h3>
      {children}
    </section>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return <p className="text-sm text-danger font-sans mt-2">{children}</p>;
}
