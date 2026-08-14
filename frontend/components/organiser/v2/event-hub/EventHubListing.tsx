"use client";

import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveEventInventory,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { AllImageData, getUsersEventImagesUrls, getUsersEventThumbnailsUrls } from "@/services/src/images/imageService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  TicketIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ImagePickerReveal } from "../shared/ImagePickerLoading";
import { ShortDateBadge } from "../shared/ShortDateBadge";
import { EVENT_HUB_EDIT_FORM_ID, EventHubEditForm } from "./EventHubEditForm";
import { EventHubPanel } from "./EventHubPanel";
import { EventHubShareControl } from "./EventHubShareControl";
import { EventHubGhostButton, EventHubPrimaryButton, EventHubStage } from "./EventHubStage";

type EventHubListingProps = {
  loading: boolean;
  eventId: EventId;
  eventName: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventSport: string;
  /** Legacy-only fallbacks when the event has no ticket types. */
  eventCapacity: number;
  eventVacancy: number;
  eventPrice: number;
  eventRegistrationDeadline: Timestamp;
  eventEventLink: string;
  eventImage: string;
  eventThumbnail: string;
  isActive: boolean;
  isPrivate: boolean;
  eventTicketTypes?: EventTicketTypesMap;
  orderTicketsMap?: Map<Order, Ticket[]>;
  setEventTicketTypes?: (types: EventTicketTypesMap | undefined) => void;
  onPersistTicketTypes?: (nextTypes: EventTicketTypesMap) => Promise<void>;
  /** Templates have no public `/event/[id]` page — hide share + glass URL. */
  mode?: "event" | "template";
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
  eventImage,
  eventThumbnail,
  isActive,
  isPrivate,
  eventTicketTypes,
  orderTicketsMap,
  setEventTicketTypes,
  onPersistTicketTypes,
  mode = "event",
  updateData,
}: EventHubListingProps) {
  const { user } = useUser();
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const isTemplate = mode === "template";

  const cover = eventImage || eventThumbnail;
  const hostName = [user.firstName, user.surname].filter(Boolean).join(" ") || user.username || "You";
  const hostEmail = user.contactInformation?.email || "";
  const inventory = useMemo(
    () =>
      resolveEventInventory({
        eventTicketTypes,
        price: eventPrice,
        capacity: eventCapacity,
        vacancy: eventVacancy,
      }),
    [eventCapacity, eventPrice, eventTicketTypes, eventVacancy]
  );
  const filled = Math.max(0, inventory.capacity - inventory.vacancy);
  const priceLabel = getEventPriceDisplay(inventory.price, true);
  const capacityLabel = inventory.capacity > 0 ? `${filled} / ${inventory.capacity} spots` : "Capacity not set";
  const publicHost = publicUrl.replace(/^https?:\/\//, "");
  const showPriceRow = !(
    hasEventTicketTypes({ eventTicketTypes }) && getSortedEventTicketTypes(eventTicketTypes).length > 1
  );
  const sortedTicketTypes = getSortedEventTicketTypes(eventTicketTypes);
  const showTicketTypesRow = hasEventTicketTypes({ eventTicketTypes }) && sortedTicketTypes.length > 0;
  const startDateLabel = timestampToDateString(eventStartDate);
  const endDateLabel = timestampToDateString(eventEndDate);
  const isMultiDay = startDateLabel !== endDateLabel;

  useEffect(() => {
    if (isTemplate) {
      setPublicUrl("");
      return;
    }
    setPublicUrl(getUrlWithCurrentHostname(`/event/${eventId}`));
  }, [eventId, isTemplate]);

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <EventHubStage className="space-y-8">
      <section className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0 lg:divide-x divide-border">
          <div className="p-4 sm:p-5">
            {loading ? (
              <Skeleton className="!rounded-xl aspect-video w-full" />
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
                {cover ? (
                  <Image src={cover} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28rem" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pb-10">
                    <PhotoIcon className="h-10 w-10 text-foreground-muted" aria-hidden />
                  </div>
                )}
                {!isTemplate ? (
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-xl border border-white/50 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-xl">
                    <a
                      href={publicUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 inline-flex items-center gap-1.5 text-xs text-foreground font-sans hover:text-foreground-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
                    >
                      <span className="truncate">{publicHost || "…"}</span>
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                      <span className="sr-only">Open event page</span>
                    </a>
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!publicUrl}
                      className="shrink-0 text-xs font-semibold tracking-wide uppercase text-foreground hover:text-foreground-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded disabled:opacity-50 font-sans"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-4 border-t lg:border-t-0 border-border">
            <h3 className="text-base font-semibold text-foreground font-sans">When & Where</h3>
            {loading ? (
              <Skeleton count={4} />
            ) : (
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <ShortDateBadge date={eventStartDate.toDate()} />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-foreground font-sans">
                      {isMultiDay ? `${startDateLabel} – ${endDateLabel}` : startDateLabel}
                    </p>
                    <p className="text-sm text-foreground-secondary font-sans">
                      {timestampToTimeOfDay(eventStartDate)} – {timestampToTimeOfDay(eventEndDate)}
                    </p>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                    aria-hidden
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    {eventLocation ? (
                      <p className="text-sm font-semibold text-foreground font-sans">{eventLocation}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground font-sans">Location missing</p>
                        <p className="text-sm text-foreground-secondary font-sans">Add a location in Edit details</p>
                      </>
                    )}
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                    aria-hidden
                  >
                    {showTicketTypesRow ? <TicketIcon className="h-5 w-5" /> : <UserGroupIcon className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    {showTicketTypesRow ? (
                      <>
                        <p className="text-sm font-semibold text-foreground font-sans">Ticket types</p>
                        <ul className="mt-1 space-y-0.5">
                          {sortedTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
                            <li key={eventTicketTypeId} className="text-sm text-foreground-secondary font-sans">
                              {eventTicketType.name}
                              <span className="text-foreground-muted">
                                {" "}
                                · {getEventPriceDisplay(eventTicketType.price, true)} · {eventTicketType.capacity} spots
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground font-sans">Capacity</p>
                        <p className="text-sm text-foreground-secondary font-sans">{capacityLabel}</p>
                      </>
                    )}
                  </div>
                </li>

                {!showTicketTypesRow && showPriceRow ? (
                  <li className="flex gap-3 items-start">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                      aria-hidden
                    >
                      <CurrencyDollarIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-foreground font-sans">Price</p>
                      <p className="text-sm text-foreground-secondary font-sans">{priceLabel}</p>
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 sm:px-5 py-3">
          {isTemplate ? <span aria-hidden className="w-px" /> : <EventHubShareControl eventId={eventId} />}
          <div className="flex flex-wrap items-center gap-2">
            <EventHubGhostButton onClick={() => setEditOpen(true)} disabled={loading}>
              <PencilSquareIcon className="h-4 w-4" aria-hidden />
              Edit details
            </EventHubGhostButton>
            <EventHubGhostButton onClick={() => setPhotoOpen(true)} disabled={!isActive || loading}>
              <PhotoIcon className="h-4 w-4" aria-hidden />
              Change photo
            </EventHubGhostButton>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground font-sans mb-3">Hosts</h3>
        <div className="rounded-xl border border-border bg-background px-4 py-3 flex items-center gap-3">
          {user.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profilePicture}
              alt=""
              className="h-10 w-10 rounded-full object-cover border border-border"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground-secondary font-sans">
              {hostName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground font-sans truncate">{hostName}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium font-sans">
                Creator
              </span>
            </div>
            {hostEmail ? <p className="text-xs text-foreground-muted font-sans truncate">{hostEmail}</p> : null}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground font-sans">Visibility & Discovery</h3>
        <p className="mt-1 text-xs text-foreground-muted font-sans mb-3">
          {isTemplate
            ? "How people can find occurrences created from this template on SPORTSHUB."
            : "How people can find this event on SPORTSHUB."}
        </p>
        <div className="rounded-xl border border-border bg-background px-4 py-4 flex items-start gap-3">
          {isPrivate ? (
            <LockClosedIcon className="h-5 w-5 text-foreground-secondary shrink-0 mt-0.5" aria-hidden />
          ) : (
            <GlobeAltIcon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground font-sans">
              {isPrivate ? <span>Private</span> : <span className="text-emerald-700">Public</span>}
              <span className="text-foreground-secondary font-normal">
                {isPrivate
                  ? isTemplate
                    ? " — Only people with the link can view created occurrences."
                    : " — Only people with the link can view this event."
                  : isTemplate
                    ? " — Occurrences are listed on your profile and discoverable on SPORTSHUB."
                    : " — This event is listed on your profile and discoverable on SPORTSHUB."}
              </span>
            </p>
          </div>
        </div>
      </section>

      <EventHubPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          !isActive
            ? isTemplate
              ? "Template details"
              : "Event details"
            : isTemplate
              ? "Edit template"
              : "Edit Event"
        }
        wide
        footer={
          isActive ? (
            <EventHubPrimaryButton
              type="submit"
              form={EVENT_HUB_EDIT_FORM_ID}
              disabled={savingEdit || loading}
            >
              <CheckIcon className="h-4 w-4" aria-hidden />
              {isTemplate ? "Update template" : "Update event"}
            </EventHubPrimaryButton>
          ) : (
            <EventHubGhostButton onClick={() => setEditOpen(false)}>Close</EventHubGhostButton>
          )
        }
      >
        {editOpen ? (
          <EventHubEditForm
            eventId={eventId}
            eventName={eventName}
            eventDescription={eventDescription}
            eventStartDate={eventStartDate}
            eventEndDate={eventEndDate}
            eventLocation={eventLocation}
            eventSport={eventSport}
            eventRegistrationDeadline={eventRegistrationDeadline}
            eventEventLink={eventEventLink}
            isActive={isActive}
            eventTicketTypes={eventTicketTypes}
            orderTicketsMap={orderTicketsMap}
            setEventTicketTypes={setEventTicketTypes}
            onPersistTicketTypes={onPersistTicketTypes}
            hideTicketTypeFormSelector={!isTemplate}
            updateData={updateData}
            onSaved={() => setEditOpen(false)}
            onSavingChange={setSavingEdit}
          />
        ) : null}
      </EventHubPanel>

      <ChangePhotoPanel
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        eventId={eventId}
        eventImage={eventImage}
        eventThumbnail={eventThumbnail}
        updateData={updateData}
      />
    </EventHubStage>
  );
}

function ChangePhotoPanel({
  open,
  onClose,
  eventId,
  eventImage,
  eventThumbnail,
  updateData,
}: {
  open: boolean;
  onClose: () => void;
  eventId: EventId;
  eventImage: string;
  eventThumbnail: string;
  updateData: (id: EventId, data: Partial<EventData>) => Promise<void>;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);
  const [eventThumbnailUrls, setEventThumbnailUrls] = useState<string[]>([]);
  const [allImageData, setAllImageData] = useState<AllImageData>({
    image: eventImage || undefined,
    thumbnail: eventThumbnail || undefined,
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user.userId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [thumbs, images] = await Promise.all([
          getUsersEventThumbnailsUrls(user.userId),
          getUsersEventImagesUrls(user.userId),
        ]);
        if (!active) return;
        setEventThumbnailUrls(eventThumbnail ? [eventThumbnail, ...thumbs.filter((u) => u !== eventThumbnail)] : thumbs);
        setEventImageUrls(eventImage ? [eventImage, ...images.filter((u) => u !== eventImage)] : images);
        setAllImageData({
          image: eventImage || undefined,
          thumbnail: eventThumbnail || undefined,
        });
        setDirty(false);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, user.userId, eventImage, eventThumbnail]);

  const save = async () => {
    setSaving(true);
    try {
      await updateData(eventId, {
        image: allImageData.image,
        thumbnail: allImageData.thumbnail,
      });
      setDirty(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EventHubPanel
      open={open}
      onClose={onClose}
      title="Change photo"
      wide
      footer={
        <EventHubPrimaryButton onClick={save} disabled={!dirty || saving || loading}>
          <CheckIcon className="h-4 w-4" aria-hidden />
          Save photos
        </EventHubPrimaryButton>
      }
    >
      <ImagePickerReveal loading={loading}>
        <ImageForm
          user={user}
          image={allImageData.image}
          thumbnail={allImageData.thumbnail}
          updateField={(fields) => {
            setAllImageData((prev) => ({ ...prev, ...fields }));
            setDirty(true);
          }}
          eventThumbnailsUrls={eventThumbnailUrls}
          eventImageUrls={eventImageUrls}
          setThumbnailUrls={setEventThumbnailUrls}
          setImageUrls={setEventImageUrls}
          flush
        />
      </ImagePickerReveal>
    </EventHubPanel>
  );
}
