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
import {
  formatDateToString,
  formatStringToDate,
  formatTimeTo12Hour,
  formatTimeTo24Hour,
  parseDateTimeStringToTimestamp,
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { getLocationCoordinates, initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { CalendarDaysIcon, ClockIcon, LinkIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { EventHubDescriptionEditor } from "./EventHubDescriptionEditor";
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
  eventTicketTypes?: EventTicketTypesMap;
  orderTicketsMap?: Map<Order, Ticket[]>;
  setEventTicketTypes?: (types: EventTicketTypesMap | undefined) => void;
  setEventCapacity?: (capacity: number) => void;
  setEventVacancy?: (vacancy: number) => void;
  setEventPrice?: (price: number) => void;
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
  eventTicketTypes,
  orderTicketsMap,
  setEventTicketTypes,
  setEventCapacity,
  setEventVacancy,
  setEventPrice,
  updateData,
  onSaved,
  onSavingChange,
}: EventHubEditFormProps) {
  const [name, setName] = useState(eventName);
  const [description, setDescription] = useState(eventDescription);

  const [startDate, setStartDate] = useState(timestampToDateString(eventStartDate));
  const [startTime, setStartTime] = useState(timestampToTimeOfDay(eventStartDate));
  const [endDate, setEndDate] = useState(timestampToDateString(eventEndDate));
  const [endTime, setEndTime] = useState(timestampToTimeOfDay(eventEndDate));
  const [registrationDeadlineDate, setRegistrationDeadlineDate] = useState(
    timestampToDateString(eventRegistrationDeadline)
  );
  const [registrationDeadlineTime, setRegistrationDeadlineTime] = useState(
    timestampToTimeOfDay(eventRegistrationDeadline)
  );

  const [location, setLocation] = useState(eventLocation);
  const [locationLatLng, setLocationLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [selectionMade, setSelectionMade] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [sport, setSport] = useState(eventSport);
  const [eventLink, setEventLink] = useState(eventEventLink);

  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [registrationDeadlineWarning, setRegistrationDeadlineWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const scriptLoadResult = useGoogleMapsScript();
  const isLoaded = scriptLoadResult ? scriptLoadResult.isLoaded : false;
  const loadError = scriptLoadResult ? scriptLoadResult.loadError : undefined;

  useEffect(() => {
    setName(eventName);
    setDescription(eventDescription);
    setStartDate(timestampToDateString(eventStartDate));
    setStartTime(timestampToTimeOfDay(eventStartDate));
    setEndDate(timestampToDateString(eventEndDate));
    setEndTime(timestampToTimeOfDay(eventEndDate));
    setRegistrationDeadlineDate(timestampToDateString(eventRegistrationDeadline));
    setRegistrationDeadlineTime(timestampToTimeOfDay(eventRegistrationDeadline));
    setLocation(eventLocation);
    setSelectionMade(true);
    setLocationError("");
    setSport(eventSport);
    setEventLink(eventEventLink);
  }, [
    eventName,
    eventDescription,
    eventStartDate,
    eventEndDate,
    eventRegistrationDeadline,
    eventLocation,
    eventSport,
    eventEventLink,
  ]);

  useEffect(() => {
    if (!isLoaded || !locationInputRef.current) return;
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
  }, [isLoaded]);

  const skipStartSync = useRef(true);
  useEffect(() => {
    if (skipStartSync.current) {
      skipStartSync.current = false;
      return;
    }
    setRegistrationDeadlineDate(startDate);
    setRegistrationDeadlineTime(startTime);
    setEndDate(startDate);
  }, [startDate]);

  useEffect(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = new Date(`${formatStringToDate(startDate)}T${formatTimeTo24Hour(startTime)}`);
    const selectedEndDateTime = new Date(`${formatStringToDate(endDate)}T${formatTimeTo24Hour(endTime)}`);
    const selectedRegistrationDeadline = new Date(
      `${formatStringToDate(registrationDeadlineDate)}T${formatTimeTo24Hour(registrationDeadlineTime)}`
    );

    setDateWarning(currentDateTime > selectedStartDateTime ? "Event start date and time is in the past!" : null);
    setTimeWarning(selectedEndDateTime < selectedStartDateTime ? "Event must end after it starts!" : null);
    setRegistrationDeadlineWarning(
      selectedRegistrationDeadline > selectedEndDateTime ? "Registration deadline is after event end!" : null
    );
  }, [startDate, startTime, endDate, endTime, registrationDeadlineDate, registrationDeadlineTime]);

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
    if (!isActive || saving) return;

    if (dateWarning || timeWarning || registrationDeadlineWarning) return;

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
        startDate: parseDateTimeStringToTimestamp(`${startDate} ${startTime}`),
        endDate: parseDateTimeStringToTimestamp(`${endDate} ${endTime}`),
        registrationDeadline: parseDateTimeStringToTimestamp(
          `${registrationDeadlineDate} ${registrationDeadlineTime}`
        ),
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

  const hasBlockingWarning = Boolean(dateWarning || timeWarning || registrationDeadlineWarning || locationError);
  const canEditTicketTypes = Boolean(
    orderTicketsMap && setEventTicketTypes && setEventCapacity && setEventVacancy && setEventPrice
  );

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-8">
      <Section label="Basic Info">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          aria-label="Event title"
          placeholder="Event title"
          className="w-full border-0 border-b border-border bg-transparent px-0 py-2 text-xl font-semibold tracking-tight text-foreground font-sans placeholder:text-foreground-muted focus:border-focus focus:outline-none focus-visible:outline-none"
        />
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground-muted font-sans">Description</span>
          </div>
          <EventHubDescriptionEditor description={description} updateDescription={setDescription} />
        </div>
      </Section>

      <Section label="Time">
        <div className="space-y-3">
          <TimeRow
            label="Start"
            filled
            dateValue={formatStringToDate(startDate)}
            timeValue={formatTimeTo24Hour(startTime)}
            onDateChange={(v) => setStartDate(formatDateToString(v))}
            onTimeChange={(v) => setStartTime(formatTimeTo12Hour(v))}
          />
          <TimeRow
            label="End"
            filled={false}
            dateValue={formatStringToDate(endDate)}
            timeValue={formatTimeTo24Hour(endTime)}
            onDateChange={(v) => setEndDate(formatDateToString(v))}
            onTimeChange={(v) => setEndTime(formatTimeTo12Hour(v))}
          />
          <div className="pt-1">
            <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Registration deadline</p>
            <div className="grid grid-cols-2 gap-2">
              <FieldWithIcon icon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}>
                <input
                  type="date"
                  value={formatStringToDate(registrationDeadlineDate)}
                  onChange={(e) => setRegistrationDeadlineDate(formatDateToString(e.target.value))}
                  className={fieldClass}
                  aria-label="Registration deadline date"
                />
              </FieldWithIcon>
              <FieldWithIcon icon={<ClockIcon className="h-4 w-4" aria-hidden />}>
                <input
                  type="time"
                  value={formatTimeTo24Hour(registrationDeadlineTime)}
                  onChange={(e) => setRegistrationDeadlineTime(formatTimeTo12Hour(e.target.value))}
                  className={fieldClass}
                  aria-label="Registration deadline time"
                />
              </FieldWithIcon>
            </div>
          </div>
        </div>
        {dateWarning ? <Warning>{dateWarning}</Warning> : null}
        {timeWarning ? <Warning>{timeWarning}</Warning> : null}
        {registrationDeadlineWarning ? <Warning>{registrationDeadlineWarning}</Warning> : null}
      </Section>

      <Section label="Location">
        {loadError ? <Warning>Error loading maps</Warning> : null}
        <FieldWithIcon icon={<MapPinIcon className="h-4 w-4" aria-hidden />}>
          <input
            ref={locationInputRef}
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSelectionMade(false);
            }}
            onBlur={() => {
              if (!selectionMade && location.trim() !== "") {
                setLocationError("Please select a location from the dropdown");
              }
            }}
            placeholder={isLoaded ? "What’s the address?" : "Loading maps…"}
            disabled={!isLoaded && !loadError}
            className={fieldClass}
            aria-label="Event location"
          />
        </FieldWithIcon>
        {locationError ? <Warning>{locationError}</Warning> : null}
      </Section>

      {canEditTicketTypes ? (
        <Section label="Ticket Types">
          <EventHubTicketTypesEditor
            eventId={eventId}
            eventTicketTypes={eventTicketTypes}
            orderTicketsMap={orderTicketsMap!}
            isActive={isActive}
            setEventTicketTypes={setEventTicketTypes!}
            setEventCapacity={setEventCapacity!}
            setEventVacancy={setEventVacancy!}
            setEventPrice={setEventPrice!}
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
            </FieldWithIcon>
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-foreground-muted font-sans">Event link</span>
            <FieldWithIcon icon={<LinkIcon className="h-4 w-4" aria-hidden />}>
              <input
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                placeholder="https://"
                className={fieldClass}
              />
            </FieldWithIcon>
          </label>
        </div>
      </Section>

      {/* Hidden submit enables Enter-to-save; real CTA is the panel footer button */}
      <button type="submit" className="sr-only" disabled={!isActive || saving || hasBlockingWarning} tabIndex={-1}>
        Update event
      </button>
    </form>
  );
}

const fieldClass =
  "w-full min-w-0 rounded-xl border-0 bg-transparent py-2.5 pl-9 pr-3 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus:outline-none";

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted font-sans">{label}</h3>
      {children}
    </section>
  );
}

function FieldWithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex items-center rounded-xl border border-border bg-background focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
      <span className="pointer-events-none absolute left-3 text-foreground-muted">{icon}</span>
      {children}
    </div>
  );
}

function TimeRow({
  label,
  filled,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  filled: boolean;
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center pt-3" aria-hidden>
        <span
          className={`h-2.5 w-2.5 rounded-full border-2 ${
            filled ? "border-foreground bg-foreground" : "border-foreground-muted bg-background"
          }`}
        />
        {filled ? <span className="mt-1 w-px flex-1 min-h-[2.5rem] bg-border" /> : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs font-medium text-foreground-muted font-sans">{label}</p>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithIcon icon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              className={fieldClass}
              aria-label={`${label} date`}
            />
          </FieldWithIcon>
          <FieldWithIcon icon={<ClockIcon className="h-4 w-4" aria-hidden />}>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => onTimeChange(e.target.value)}
              className={fieldClass}
              aria-label={`${label} time`}
            />
          </FieldWithIcon>
        </div>
      </div>
    </div>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return <p className="text-sm text-danger font-sans mt-2">{children}</p>;
}
