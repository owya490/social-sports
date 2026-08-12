"use client";

/**
 * THESIS: One-viewport create — thumbnail rail beside compact essentials — refuses scroll and the old wizard.
 * OWN-WORLD: Honest Clubhouse tokens on white canvas, Satoshi, dense soft controls.
 * STORY: Organiser names the session, sets when/where/price, pauses registration by default, creates.
 * FIRST VIEWPORT: Thumbnail + sport + Public↔Private pill left; title; when/where; price+capacity then payments+recurring; Create.
 * FORM: Luma create density inside organiser tokens; deep edits in EventHubPanel.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { CreateEventRecurrenceModal } from "@/components/events/create/CreateEventRecurrenceModal";
import { CreateEventFormData } from "@/components/events/create/createEventFormTypes";
import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { EventHubDescriptionEditor } from "@/components/organiser/v2/event-hub/EventHubDescriptionEditor";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { EventHubGhostButton } from "@/components/organiser/v2/event-hub/EventHubStage";
import { ShortDateBadge } from "@/components/organiser/v2/shared/ShortDateBadge";
import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { Frequency, NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { getThumbnailUrlsBySport } from "@/services/src/images/imageService";
import { getLocationCoordinates, initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS } from "@/services/src/stripe/stripeConstants";
import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { centsToDollars, dollarsToCents } from "@/utilities/priceUtils";
import {
  ArrowPathIcon,
  CameraIcon,
  ChevronDownIcon,
  CreditCardIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapPinIcon,
  TicketIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Alert } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

export const STRIPE_MIN_PRICE_ERROR_MESSAGE = `Price cannot be below $${(
  MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS / 100
).toFixed(2)}`;

const validatePrice = (amount: number): string | null => {
  if (amount > 0 && amount < MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS / 100) {
    return STRIPE_MIN_PRICE_ERROR_MESSAGE;
  }
  return null;
};

function formatFrequency(frequency: Frequency): string {
  switch (frequency) {
    case Frequency.WEEKLY:
      return "Weekly";
    case Frequency.FORTNIGHTLY:
      return "Fortnightly";
    case Frequency.MONTHLY:
      return "Monthly";
    default:
      return "On";
  }
}

function formatShortWeekdayDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" });
}

function formatClock(time: string): string {
  const [hRaw, mRaw] = time.split(":");
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const period = hours >= 12 ? "pm" : "am";
  const adjusted = hours % 12 || 12;
  return `${adjusted.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function OptionCell({
  icon,
  label,
  children,
  onClick,
  supporting,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  onClick?: () => void;
  supporting?: string;
  className?: string;
}) {
  const body = (
    <>
      <span aria-hidden className="shrink-0 text-foreground-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground font-sans leading-tight">{label}</span>
        {supporting ? (
          <span className="block text-xs text-foreground-muted font-sans leading-snug mt-0.5">{supporting}</span>
        ) : null}
      </span>
      <span className="shrink-0 flex items-center gap-1 text-xs text-foreground-secondary font-sans">{children}</span>
    </>
  );

  const shell =
    "flex w-full min-h-[2.75rem] items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2 text-left transition-colors";

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${shell} hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground ${className}`}
      >
        {body}
      </div>
    );
  }

  return <div className={`${shell} ${className}`}>{body}</div>;
}

function VisibilityPill({
  isPrivate,
  onChange,
}: {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Event visibility"
      className="relative flex w-full max-w-[13.5rem] items-stretch rounded-full border border-border bg-surface p-0.5"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full border border-border bg-background shadow-sm transition-transform duration-200 ease-out ${
          isPrivate ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        aria-pressed={!isPrivate}
        onClick={() => onChange(false)}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full px-1.5 py-1 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground ${
          !isPrivate ? "text-foreground" : "text-foreground-muted"
        }`}
      >
        <GlobeAltIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Public
      </button>
      <button
        type="button"
        aria-pressed={isPrivate}
        onClick={() => onChange(true)}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full px-1.5 py-1 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground ${
          isPrivate ? "text-foreground" : "text-foreground-muted"
        }`}
      >
        <LockClosedIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Private
      </button>
    </div>
  );
}

function ClubhouseSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative shrink-0 h-5 w-9 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
        checked ? "bg-foreground" : "bg-surface-muted"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

type CreateEventWorkbenchProps = {
  data: CreateEventFormData;
  user: UserData;
  updateField: (fields: Partial<CreateEventFormData>) => void;
  eventThumbnailsUrls: string[];
  eventImageUrls: string[];
  setThumbnailUrls: (urls: string[]) => void;
  setImageUrls: (urls: string[]) => void;
  setLoading: (value: boolean) => void;
  setHasError: (value: boolean) => void;
  hasAlert: boolean;
  alertMessage: string;
  onAlertClose: () => void;
  onSubmit: (e: FormEvent) => void;
};

type CreatePanel = "photo" | "description" | "payments" | null;

export function CreateEventWorkbench({
  data,
  user,
  updateField,
  eventThumbnailsUrls,
  eventImageUrls,
  setThumbnailUrls,
  setImageUrls,
  setLoading,
  setHasError,
  hasAlert,
  alertMessage,
  onAlertClose,
  onSubmit,
}: CreateEventWorkbenchProps) {
  const router = useRouter();
  const priceInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const recurrenceWasEnabledRef = useRef(false);
  const [locationDraft, setLocationDraft] = useState(data.location);
  const [selectionMade, setSelectionMade] = useState(Boolean(data.location));
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [panel, setPanel] = useState<CreatePanel>(null);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [sportOpen, setSportOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState(centsToDollars(data.price));
  const [priceDraft, setPriceDraft] = useState(() => centsToDollars(data.price).toFixed(2));
  const [capacityDraft, setCapacityDraft] = useState(String(data.capacity));

  const isFreeEvent = customAmount === 0;
  const scriptLoadResult = useGoogleMapsScript();
  const isLoaded = scriptLoadResult ? scriptLoadResult.isLoaded : false;
  const loadError = scriptLoadResult ? scriptLoadResult.loadError : undefined;

  const thumbnailUrl = useMemo(() => {
    if (typeof data.thumbnail === "string" && data.thumbnail) return data.thumbnail;
    return getThumbnailUrlsBySport(data.sport);
  }, [data.thumbnail, data.sport]);

  const selectedSport = useMemo(() => {
    return Object.values(SPORTS_CONFIG).find((s) => s.value === data.sport) ?? SPORTS_CONFIG[data.sport];
  }, [data.sport]);

  const sportName = selectedSport?.name ?? data.sport;
  const sportIcon = selectedSport?.iconImage;

  useEffect(() => {
    updateField({ endDate: data.startDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.startDate]);

  useEffect(() => {
    updateField({
      registrationEndDate: data.startDate,
      registrationEndTime: data.startTime,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.startDate, data.startTime]);

  useEffect(() => {
    setCapacityDraft(String(data.capacity));
  }, [data.capacity]);

  useEffect(() => {
    if (isLoaded && locationInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = initializeAutocomplete(locationInputRef, async () => {
        if (!autocompleteRef.current) return;
        const place = autocompleteRef.current.getPlace();
        if (place.name && place.formatted_address) {
          const fullAddress = `${place.name}, ${place.formatted_address}`;
          setLocationDraft(fullAddress);
          setSelectionMade(true);
          updateField({ location: fullAddress });
          try {
            const { lat, lng } = await getLocationCoordinates(fullAddress);
            updateField({ lat, lng });
            locationInputRef.current?.setCustomValidity("");
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init autocomplete once maps load
  }, [isLoaded]);

  useEffect(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const selectedEndDateTime = new Date(`${data.endDate}T${data.endTime}`);

    let hasDateError = false;

    if (currentDateTime > selectedStartDateTime) {
      setDateWarning("Event start date and time is in the past!");
      hasDateError = true;
    } else {
      setDateWarning(null);
    }

    if (selectedEndDateTime < selectedStartDateTime) {
      setTimeWarning("Event must end after it starts!");
      hasDateError = true;
    } else {
      setTimeWarning(null);
    }

    const priceValidationError = isFreeEvent ? null : validatePrice(customAmount);
    setPriceWarning(priceValidationError);
    const hasPriceError = priceValidationError !== null;
    if (priceInputRef.current) {
      priceInputRef.current.setCustomValidity(hasPriceError ? STRIPE_MIN_PRICE_ERROR_MESSAGE : "");
    }

    const hasNameError = data.name.trim() === "";
    const hasCapacityError = !data.capacity || data.capacity < 1;
    const hasLocationMissing = !selectionMade && locationDraft.trim() === "";
    setHasError(hasDateError || hasPriceError || hasLocationMissing || hasNameError || hasCapacityError);
  }, [
    data.startDate,
    data.startTime,
    data.endDate,
    data.endTime,
    data.name,
    data.capacity,
    customAmount,
    isFreeEvent,
    selectionMade,
    locationDraft,
    setHasError,
  ]);

  const handleCustomAmountChange = (amount: number) => {
    amount = Number.isNaN(amount) ? 0 : amount;
    setCustomAmount(amount);
    updateField({ price: dollarsToCents(amount) });
  };

  const handleRecurrenceSave = (next: NewRecurrenceFormData) => {
    updateField({ newRecurrenceData: next });
  };

  const onRecurrenceCancelEnable = () => {
    if (!recurrenceWasEnabledRef.current) {
      updateField({
        newRecurrenceData: { ...data.newRecurrenceData, recurrenceEnabled: false },
      });
    }
  };

  const recurrenceLabel = data.newRecurrenceData.recurrenceEnabled
    ? formatFrequency(data.newRecurrenceData.frequency)
    : "Off";
  const acceptPaymentsLabel = isFreeEvent ? "Accept bookings" : "Accept payments";

  const canCreate = data.name.trim() !== "" && (selectionMade || locationDraft.trim() !== "");

  const closePanel = () => setPanel(null);

  const handlePaymentsActiveChange = (next: boolean) => {
    updateField({
      paymentsActive: next,
      ...(!next && {
        stripeFeeToCustomer: true,
        promotionalCodesEnabled: false,
      }),
    });
  };

  const togglePaymentsActive = () => {
    const next = !data.paymentsActive;
    handlePaymentsActiveChange(next);
    if (next) {
      setPanel("payments");
    } else if (panel === "payments") {
      closePanel();
    }
  };

  const toggleRecurring = () => {
    const next = !data.newRecurrenceData.recurrenceEnabled;
    if (next) {
      recurrenceWasEnabledRef.current = false;
      updateField({
        newRecurrenceData: { ...data.newRecurrenceData, recurrenceEnabled: true },
      });
      setRecurrenceOpen(true);
    } else {
      updateField({
        newRecurrenceData: { ...data.newRecurrenceData, recurrenceEnabled: false },
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background font-sans">
      <Alert
        open={hasAlert}
        onClose={onAlertClose}
        color="red"
        className="fixed ml-auto mr-auto left-0 right-0 top-20 w-fit z-50"
      >
        {alertMessage !== "" ? alertMessage : "Error Submitting Form"}
      </Alert>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-5 pt-8 sm:pt-10 pb-4 sm:pb-5">
        <form
          onSubmit={onSubmit}
          className="lg:grid lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-6 lg:items-start"
        >
          <aside className="space-y-2 mb-4 lg:mb-0 lg:sticky lg:top-4">
            <button
              type="button"
              onClick={() => setPanel("photo")}
              className="group relative block w-full max-w-[13.5rem] aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              aria-label="Choose event thumbnail"
            >
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                sizes="13.5rem"
              />
              <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-sm text-foreground group-hover:bg-surface-hover transition-colors">
                <CameraIcon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>

            <div className="relative max-w-[13.5rem]">
              <button
                type="button"
                onClick={() => setSportOpen((v) => !v)}
                className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                aria-expanded={sportOpen}
                aria-haspopup="listbox"
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  {sportIcon ? (
                    <Image
                      src={sportIcon}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain opacity-80"
                    />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground-muted leading-none">Sport</p>
                  <p className="text-xs font-medium text-foreground truncate mt-0.5">{sportName}</p>
                </div>
                <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
              </button>

              {sportOpen ? (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg py-1"
                >
                  {Object.entries(SPORTS_CONFIG).map(([key, sportInfo]) => (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={data.sport === sportInfo.value}
                      onClick={() => {
                        updateField({ sport: sportInfo.value });
                        setSportOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-sans transition-colors hover:bg-surface-hover ${
                        data.sport === sportInfo.value ? "bg-surface-muted text-foreground font-medium" : "text-foreground"
                      }`}
                    >
                      <Image
                        src={sportInfo.iconImage}
                        alt=""
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 object-contain opacity-70"
                      />
                      {sportInfo.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <VisibilityPill
              isPrivate={data.isPrivate}
              onChange={(next) => updateField({ isPrivate: next })}
            />
          </aside>

          <div className="min-w-0 space-y-2.5">
            <div>
              <label htmlFor="create-event-name" className="sr-only">
                Event name
              </label>
              <input
                id="create-event-name"
                required
                maxLength={100}
                value={data.name}
                onChange={(e) => updateField({ name: e.target.value })}
                placeholder="Event Name"
                className="w-full bg-transparent border-0 px-0 py-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-foreground-muted/60 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              />
            </div>

            <div className="rounded-xl border border-border bg-background px-3 py-2 space-y-2">
              <div className="flex items-center gap-2.5">
                <ShortDateBadge date={data.startDate} />
                <div className="grid min-w-0 flex-1 grid-cols-[0.625rem_1fr] gap-x-2.5">
                  <div aria-hidden />
                  <p className="text-xs font-medium text-foreground-muted mb-0.5">Start</p>

                  <div className="relative flex items-center justify-center self-stretch" aria-hidden>
                    <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-foreground bg-foreground" />
                    <span className="absolute top-1/2 bottom-0 w-px bg-border" />
                  </div>
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5 self-center">
                    <label className="sr-only" htmlFor="create-start-date">
                      Start date
                    </label>
                    <input
                      id="create-start-date"
                      type="date"
                      required
                      value={data.startDate}
                      onChange={(e) => updateField({ startDate: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground font-sans outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                      aria-label={`Start ${formatShortWeekdayDate(data.startDate)}`}
                      ref={(input) => {
                        if (input) input.setCustomValidity(dateWarning?.includes("start") ? dateWarning : "");
                      }}
                    />
                    <span className="text-xs text-foreground-muted">at</span>
                    <label className="sr-only" htmlFor="create-start-time">
                      Start time
                    </label>
                    <input
                      id="create-start-time"
                      type="time"
                      required
                      value={data.startTime}
                      onChange={(e) => updateField({ startTime: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground font-sans outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                      aria-label={`Start ${formatClock(data.startTime)}`}
                    />
                  </div>

                  <div className="flex justify-center self-stretch" aria-hidden>
                    <span className="w-px h-full min-h-[1rem] bg-border" />
                  </div>
                  <p className="text-xs font-medium text-foreground-muted mb-0.5 self-end">End</p>

                  <div className="flex items-center justify-center" aria-hidden>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-foreground-muted bg-background" />
                  </div>
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5 self-center">
                    <label className="sr-only" htmlFor="create-end-date">
                      End date
                    </label>
                    <input
                      id="create-end-date"
                      type="date"
                      required
                      value={data.endDate}
                      onChange={(e) => updateField({ endDate: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground font-sans outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                      ref={(input) => {
                        if (input)
                          input.setCustomValidity(
                            dateWarning?.includes("end") || timeWarning ? dateWarning ?? timeWarning ?? "" : ""
                          );
                      }}
                    />
                    <span className="text-xs text-foreground-muted">at</span>
                    <label className="sr-only" htmlFor="create-end-time">
                      End time
                    </label>
                    <input
                      id="create-end-time"
                      type="time"
                      required
                      value={data.endTime}
                      onChange={(e) => updateField({ endTime: e.target.value })}
                      className="rounded-lg border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground font-sans outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
              {(dateWarning || timeWarning) && (
                <p className="text-xs text-danger font-sans">{dateWarning || timeWarning}</p>
              )}
            </div>

            <div
              className="rounded-xl border border-border bg-background overflow-hidden cursor-text transition-colors hover:bg-surface-hover/60 focus-within:outline-none focus-within:ring-0"
              onClick={() => locationInputRef.current?.focus()}
            >
              {loadError ? <p className="text-xs text-danger font-sans px-2.5 pt-2">Error loading maps</p> : null}
              <div className="relative flex items-start gap-2.5 px-2.5 py-2.5">
                <MapPinIcon className="h-4 w-4 shrink-0 text-foreground-muted mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <label htmlFor="create-event-location" className="block text-xs font-medium text-foreground cursor-text">
                    {locationDraft ? "Location" : "Add Event Location"}
                  </label>
                  <input
                    id="create-event-location"
                    ref={locationInputRef}
                    value={locationDraft}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLocationDraft(next);
                      setSelectionMade(false);
                      locationInputRef.current?.setCustomValidity("");
                      if (next.trim() === "") {
                        updateField({ location: "" });
                      }
                    }}
                    onBlur={() => {
                      const trimmed = locationDraft.trim();
                      if (trimmed === "") {
                        updateField({ location: "" });
                        locationInputRef.current?.setCustomValidity("");
                        return;
                      }
                      if (!selectionMade) {
                        updateField({ location: trimmed });
                      }
                      locationInputRef.current?.setCustomValidity("");
                    }}
                    placeholder={isLoaded ? "Search a location or paste an address" : "Loading maps…"}
                    disabled={!isLoaded && !loadError}
                    className="w-full bg-transparent border-0 p-0 mt-1 text-xs text-foreground font-sans placeholder:text-foreground-muted outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    aria-label="Event location"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPanel("description")}
              className="flex w-full min-h-[2.75rem] items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <DocumentTextIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
              <span className="min-w-0 flex-1 text-xs font-medium text-foreground">
                {data.description ? "Description" : "Add Description"}
              </span>
            </button>

            <div>
              <h2 className="text-xs font-medium text-foreground-muted mb-1.5 px-0.5">Event Options</h2>
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <OptionCell icon={<TicketIcon className="h-4 w-4" />} label="Ticket Price">
                    <label htmlFor="create-event-price" className="sr-only">
                      Ticket price in dollars
                    </label>
                    <span className="text-foreground-muted" aria-hidden>
                      $
                    </span>
                    <input
                      id="create-event-price"
                      ref={priceInputRef}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={priceDraft}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setPriceDraft(raw);
                        let value = parseFloat(parseFloat(raw).toFixed(2));
                        if (Number.isNaN(value)) value = 0;
                        handleCustomAmountChange(value);
                        setPriceWarning(validatePrice(value));
                      }}
                      onBlur={() => {
                        setPriceDraft(customAmount.toFixed(2));
                      }}
                      className="w-16 bg-transparent border-0 p-0 text-right text-xs font-medium text-foreground font-sans tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </OptionCell>

                  <OptionCell icon={<UserGroupIcon className="h-4 w-4" />} label="Capacity">
                    <label htmlFor="create-event-capacity" className="sr-only">
                      Max attendees
                    </label>
                    <input
                      id="create-event-capacity"
                      type="number"
                      required
                      min={1}
                      value={capacityDraft}
                      onChange={(e) => {
                        setCapacityDraft(e.target.value);
                        const parsed = parseInt(e.target.value, 10);
                        updateField({ capacity: Number.isNaN(parsed) ? 0 : Math.max(parsed, 0) });
                      }}
                      className="w-14 bg-transparent border-0 p-0 text-right text-xs font-medium text-foreground font-sans tabular-nums outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </OptionCell>
                </div>
                {priceWarning ? <p className="text-xs text-danger font-sans px-0.5">{priceWarning}</p> : null}

                {user.stripeAccountActive ? (
                  <OptionCell
                    icon={<CreditCardIcon className="h-4 w-4" />}
                    label={acceptPaymentsLabel}
                    onClick={togglePaymentsActive}
                  >
                    <ClubhouseSwitch
                      checked={data.paymentsActive}
                      onChange={togglePaymentsActive}
                      label={acceptPaymentsLabel}
                    />
                  </OptionCell>
                ) : (
                  <div className="rounded-xl border border-border bg-background px-2.5 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Accept payments on SPORTSHUB</p>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Connect Stripe to take bookings and payouts through the platform.
                    </p>
                    <EventHubGhostButton
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        window.scrollTo(0, 0);
                        const link = await getStripeStandardAccountLink(
                          user.userId,
                          getUrlWithCurrentHostname("/organiser/dashboard"),
                          getRefreshAccountLinkUrl()
                        );
                        router.push(link);
                      }}
                    >
                      Connect Stripe
                    </EventHubGhostButton>
                  </div>
                )}

                <OptionCell
                  icon={<ArrowPathIcon className="h-4 w-4" />}
                  label="Recurring"
                  onClick={toggleRecurring}
                >
                  <ClubhouseSwitch
                    checked={data.newRecurrenceData.recurrenceEnabled}
                    onChange={toggleRecurring}
                    label="Recurring"
                  />
                  {data.newRecurrenceData.recurrenceEnabled ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recurrenceWasEnabledRef.current = true;
                        setRecurrenceOpen(true);
                      }}
                      className="text-xs font-medium text-foreground-secondary hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {recurrenceLabel}
                    </button>
                  ) : null}
                </OptionCell>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canCreate}
              className="w-full inline-flex items-center justify-center rounded-xl bg-foreground px-3 py-2.5 text-sm font-semibold text-background font-sans transition-[filter,opacity,background-color,color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground enabled:hover:opacity-90 disabled:bg-surface-muted disabled:text-foreground-muted disabled:cursor-not-allowed"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>

      <EventHubPanel open={panel === "photo"} onClose={closePanel} title="Event photos" wide>
        <ImageForm
          user={user}
          image={data.image}
          thumbnail={data.thumbnail}
          updateField={updateField}
          eventThumbnailsUrls={eventThumbnailsUrls}
          eventImageUrls={eventImageUrls}
          setThumbnailUrls={setThumbnailUrls}
          setImageUrls={setImageUrls}
          flush
        />
      </EventHubPanel>

      <EventHubPanel open={panel === "description"} onClose={closePanel} title="Description" wide>
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground-muted font-sans">Description</span>
          <EventHubDescriptionEditor
            description={data.description}
            updateDescription={(html) => updateField({ description: html })}
          />
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={closePanel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background font-sans hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Done
          </button>
        </div>
      </EventHubPanel>

      <EventHubPanel
        open={panel === "payments"}
        onClose={closePanel}
        title={isFreeEvent ? "Bookings" : "Payments"}
      >
        <div className="space-y-4">
          {!isFreeEvent ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pass Stripe fee to customer</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Add card surcharges and Stripe fees at checkout for the customer to pay.
                  </p>
                </div>
                <ClubhouseSwitch
                  checked={data.stripeFeeToCustomer}
                  onChange={() => updateField({ stripeFeeToCustomer: !data.stripeFeeToCustomer })}
                  label="Pass Stripe fee to customer"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Promotional codes</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Let customers apply promotional codes at checkout.
                  </p>
                </div>
                <ClubhouseSwitch
                  checked={data.promotionalCodesEnabled}
                  onChange={() => updateField({ promotionalCodesEnabled: !data.promotionalCodesEnabled })}
                  label="Promotional codes"
                />
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pause bookings on create</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Pause bookings and payment once event is created, giving you time to edit the event for further
                tweaks.
              </p>
            </div>
            <ClubhouseSwitch
              checked={data.paused}
              onChange={() => updateField({ paused: !data.paused })}
              label="Pause bookings on create"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background font-sans hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Done
            </button>
          </div>
        </div>
      </EventHubPanel>

      <CreateEventRecurrenceModal
        open={recurrenceOpen}
        onClose={() => setRecurrenceOpen(false)}
        startDate={data.startDate}
        value={data.newRecurrenceData}
        onSave={handleRecurrenceSave}
        onCancelEnable={onRecurrenceCancelEnable}
      />
    </div>
  );
}
