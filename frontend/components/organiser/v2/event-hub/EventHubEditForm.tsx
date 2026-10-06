"use client";

/**
 * THESIS: Edit details is a calm sectioned operate sheet — Basic / Time / Location / Ticket Types / Sport & Link —
 * not a sticky document toolbar or a view/edit toggle card.
 * OWN-WORLD: Honest Clubhouse light tokens, Satoshi, 12px radius, yellow Update event only;
 * TipTap bubble-on-selection; Luma section rhythm without Appearance themes.
 * STORY: Organiser opens Edit details, adjusts any Sportshub field, taps Update event once.
 * FIRST VIEWPORT: Large title → seamless description → Time timeline → Location → Ticket Types → Sport & Link;
 * yellow Update event in panel footer (form=event-hub-edit-details).
 * FORM: Comp A sectioned-timeline (approved); seed edit-redesign sections-bubble.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getLocationCoordinates, initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { LinkIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { EventHubDescriptionEditor } from "./EventHubDescriptionEditor";
import {
  EventHubFieldWithIcon as FieldWithIcon,
  EventHubScheduleFields,
  eventHubFieldClass as fieldClass,
  type EventHubScheduleValue,
} from "./EventHubScheduleFields";
import { EventHubTicketTypesEditor } from "./EventHubTicketTypesEditor";

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
  eventTicketTypes?: EventTicketTypesMap;
  orderTicketsMap?: Map<Order, Ticket[]>;
  setEventTicketTypes?: (types: EventTicketTypesMap | undefined) => void;
  onPersistTicketTypes?: (nextTypes: EventTicketTypesMap) => Promise<void>;
  hideTicketTypeFormSelector?: boolean;
  updateData: (id: EventId, data: Partial<EventData>) => Promise<void>;
  onSaved: () => void;
  onSavingChange?: (saving: boolean) => void;
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
  eventTicketTypes,
  orderTicketsMap,
  setEventTicketTypes,
  onPersistTicketTypes,
  hideTicketTypeFormSelector = true,
  updateData,
  onSaved,
  onSavingChange,
}: EventHubEditFormProps) {
  const [name, setName] = useState(eventName);
  const [description, setDescription] = useState(eventDescription);

  const [location, setLocation] = useState(eventLocation);
  const [locationLatLng, setLocationLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [selectionMade, setSelectionMade] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [sport, setSport] = useState(eventSport);
  const [eventLink, setEventLink] = useState(eventEventLink ?? "");

  const [saving, setSaving] = useState(false);
  const [scheduleBlocking, setScheduleBlocking] = useState(false);
  const scheduleRef = useRef<EventHubScheduleValue | null>(null);

  const readOnly = !isActive || ended;

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const scriptLoadResult = useGoogleMapsScript();
  const isLoaded = scriptLoadResult ? scriptLoadResult.isLoaded : false;
  const loadError = scriptLoadResult ? scriptLoadResult.loadError : undefined;

  const onScheduleChange = useCallback((value: EventHubScheduleValue) => {
    scheduleRef.current = value;
    setScheduleBlocking((current) => (current === value.hasBlockingWarning ? current : value.hasBlockingWarning));
  }, []);

  useEffect(() => {
    setName(eventName);
    setDescription(eventDescription);
    setLocation(eventLocation);
    setSelectionMade(true);
    setLocationError("");
    setSport(eventSport);
    setEventLink(eventEventLink ?? "");
  }, [eventName, eventDescription, eventLocation, eventSport, eventEventLink]);

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
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

  const handlePlaceSelect = async () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.name && place.formatted_address) {
      setSelectionMade(true);
      const fullAddress = `${place.name}, ${place.formatted_address}`;
      setLocation(fullAddress);
      setLocationError("");
      try {
        const coords = await getLocationCoordinates(fullAddress);
        setLocationLatLng(coords);
      } catch {
        setLocationError("Failed to get location coordinates");
        setSelectionMade(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const schedule = scheduleRef.current;
    if (readOnly || saving || !schedule || schedule.hasBlockingWarning) return;

    if (!selectionMade && location.trim() !== "") {
      setLocationError("Please select a location from the dropdown");
      return;
    }
    if (location.trim() === "") {
      setLocationError("Location is required");
      return;
    }

    setSaving(true);
    try {
      let latLng = locationLatLng;
      if (!latLng) {
        latLng = await getLocationCoordinates(location);
      }

      const nextName = name.trim();

      await updateData(eventId, {
        name: nextName,
        nameTokens: nextName.toLowerCase().split(" "),
        description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        registrationDeadline: schedule.registrationDeadline,
        location,
        locationTokens: location.toLowerCase().split(" "),
        locationLatLng: { lat: latLng.lat, lng: latLng.lng },
        sport,
        eventLink,
      });

      onSaved();
    } catch {
      setLocationError("Couldn’t save — check location and try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasBlockingWarning = scheduleBlocking || Boolean(locationError);
  const canEditTicketTypes = Boolean(orderTicketsMap && setEventTicketTypes);

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-8">
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
            editable={!readOnly}
          />
        </div>
      </Section>

      <EventHubScheduleFields
        eventStartDate={eventStartDate}
        eventEndDate={eventEndDate}
        eventRegistrationDeadline={eventRegistrationDeadline}
        readOnly={readOnly}
        onChange={onScheduleChange}
      />

      <Section label="Location">
        {!readOnly && loadError ? <Warning>Error loading maps</Warning> : null}
        <FieldWithIcon icon={<MapPinIcon className="h-4 w-4" aria-hidden />}>
          <input
            ref={locationInputRef}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSelectionMade(false);
            }}
            onBlur={() => {
              if (readOnly) return;
              if (!selectionMade && location.trim() !== "") {
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

      {canEditTicketTypes ? (
        <Section label="Ticket Types">
          <EventHubTicketTypesEditor
            eventId={eventId}
            eventTicketTypes={eventTicketTypes}
            orderTicketsMap={orderTicketsMap!}
            isActive={!readOnly}
            setEventTicketTypes={setEventTicketTypes!}
            onPersistTicketTypes={onPersistTicketTypes}
            hideFormSelector={hideTicketTypeFormSelector}
          />
        </Section>
      ) : null}

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
      <button type="submit" className="sr-only" disabled={readOnly || saving || hasBlockingWarning} tabIndex={-1}>
        Update event
      </button>
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
