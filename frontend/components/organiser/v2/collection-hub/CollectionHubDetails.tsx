"use client";

import { ImageSection } from "@/components/gallery/ImageSection";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import {
  EventHubGhostButton,
  EventHubPrimaryButton,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { EntityRowThumbnail } from "@/components/organiser/v2/shared/EntityRowThumbnail";
import { ImagePickerReveal } from "@/components/organiser/v2/shared/ImagePickerLoading";
import { useUser } from "@/components/utility/UserContext";
import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { EventData } from "@/interfaces/EventTypes";
import { ImageConfig, ImageType } from "@/interfaces/ImageTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { getUsersEventImagesUrls, uploadEventImage } from "@/services/src/images/imageService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { CollectionHubShareControl } from "./CollectionHubShareControl";

const EDIT_FORM_ID = "collection-hub-edit-form";
const PEEK_LIMIT = 3;

type PeekItem = {
  id: string;
  name: string;
  thumbnail: string;
  meta: string;
  kind: "event" | "recurring";
};

type CollectionHubDetailsProps = {
  loading: boolean;
  collectionId: EventCollectionId;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  eventCount: number;
  templateCount: number;
  events: EventData[];
  templates: RecurrenceTemplate[];
  isPrivate: boolean;
  privacyUpdating: boolean;
  onSaveDetails: (data: { name: string; description: string }) => Promise<void>;
  onSaveImage: (imageUrl: string) => Promise<void>;
  onTogglePrivacy: (nextPrivate: boolean) => Promise<void>;
  onOpenEvents: () => void;
};

export function CollectionHubDetails({
  loading,
  collectionId,
  name,
  description,
  image,
  itemCount,
  eventCount,
  templateCount,
  events,
  templates,
  isPrivate,
  privacyUpdating,
  onSaveDetails,
  onSaveImage,
  onTogglePrivacy,
  onOpenEvents,
}: CollectionHubDetailsProps) {
  const { user } = useUser();
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);

  const publicHost = publicUrl.replace(/^https?:\/\//, "");
  const membershipLine =
    itemCount === 0
      ? "Add sessions on the Events tab"
      : [
          eventCount > 0 ? `${eventCount} event${eventCount === 1 ? "" : "s"}` : null,
          templateCount > 0 ? `${templateCount} recurring` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const peekItems = useMemo(() => {
    const fromEvents: PeekItem[] = events.map((event) => ({
      id: event.eventId,
      name: event.name,
      thumbnail: event.thumbnail || event.image,
      meta: timestampToEventCardDateString(event.startDate),
      kind: "event" as const,
    }));
    const fromTemplates: PeekItem[] = templates.map((template) => ({
      id: template.recurrenceTemplateId,
      name: template.eventData.name,
      thumbnail: template.eventData.thumbnail || template.eventData.image,
      meta: "Recurring template",
      kind: "recurring" as const,
    }));
    return [...fromEvents, ...fromTemplates].slice(0, PEEK_LIMIT);
  }, [events, templates]);

  const moreCount = Math.max(0, itemCount - peekItems.length);

  useEffect(() => {
    setPublicUrl(getUrlWithCurrentHostname(`/event-collection/${collectionId}`));
  }, [collectionId]);

  useEffect(() => {
    if (editOpen) {
      setDraftName(name);
      setDraftDescription(description);
    }
  }, [editOpen, name, description]);

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

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextName = draftName.trim();
    if (!nextName) return;
    setSavingEdit(true);
    try {
      await onSaveDetails({ name: nextName, description: draftDescription.trim() });
      setEditOpen(false);
    } finally {
      setSavingEdit(false);
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
                {image ? (
                  <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28rem" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pb-10">
                    <PhotoIcon className="h-10 w-10 text-foreground-muted" aria-hidden />
                  </div>
                )}
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-xl border border-white/50 bg-white/55 px-3 py-2 shadow-sm backdrop-blur-xl">
                  <a
                    href={publicUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 inline-flex items-center gap-1.5 text-xs text-foreground font-sans hover:text-foreground-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
                  >
                    <span className="truncate">{publicHost || "…"}</span>
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                    <span className="sr-only">Open collection page</span>
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
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-5 border-t lg:border-t-0 border-border">
            <div>
              <h3 className="text-base font-semibold text-foreground font-sans">Collection</h3>
              {loading ? (
                <Skeleton count={3} className="mt-2" />
              ) : (
                <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed whitespace-pre-wrap">
                  {description || "No description yet. Add a short note so players know what this collection groups."}
                </p>
              )}
            </div>

            <p className="text-sm text-foreground-secondary font-sans border-t border-border pt-4">
              {loading ? (
                <Skeleton width={180} />
              ) : itemCount === 0 ? (
                "No items yet — add sessions on the Events tab"
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </span>
                  <span>{` · ${membershipLine}`}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 pb-1">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 mb-1">
            <h3 className="text-sm font-semibold text-foreground font-sans">In this collection</h3>
            <button
              type="button"
              onClick={onOpenEvents}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground font-sans hover:text-foreground-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded disabled:opacity-50"
            >
              Manage on Events
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2 px-4 sm:px-5 py-2">
              <Skeleton className="!rounded-xl h-14" />
              <Skeleton className="!rounded-xl h-14" />
            </div>
          ) : peekItems.length === 0 ? (
            <p className="text-sm text-foreground-muted font-sans px-4 sm:px-5 py-3">
              Nothing in this collection yet. Add events on the Events tab.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border mt-3">
              {peekItems.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                  <EntityRowThumbnail src={item.thumbnail} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground font-sans truncate">{item.name}</p>
                    <p className="text-xs text-foreground-muted font-sans truncate">{item.meta}</p>
                  </div>
                  {item.kind === "recurring" ? (
                    <span className="shrink-0 text-xs text-foreground-muted font-sans">Recurring</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {!loading && moreCount > 0 ? (
            <button
              type="button"
              onClick={onOpenEvents}
              className="mt-2 mb-1 w-full text-center text-xs font-semibold text-foreground-secondary font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded px-4"
            >
              +{moreCount} more on Events
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 sm:px-5 py-3">
          <CollectionHubShareControl collectionId={collectionId} />
          <div className="flex flex-wrap items-center gap-2">
            <EventHubGhostButton onClick={() => setEditOpen(true)} disabled={loading}>
              <PencilSquareIcon className="h-4 w-4" aria-hidden />
              Edit details
            </EventHubGhostButton>
            <EventHubGhostButton onClick={() => setPhotoOpen(true)} disabled={loading}>
              <PhotoIcon className="h-4 w-4" aria-hidden />
              Change photo
            </EventHubGhostButton>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-foreground font-sans">Visibility</h3>
        <p className="mt-1 text-xs text-foreground-muted font-sans mb-1">
          How people can find this collection on SPORTSHUB.
        </p>
        {privacyUpdating ? (
          <p className="text-xs text-foreground-muted font-sans mb-2" aria-live="polite">
            Saving…
          </p>
        ) : null}
        <div className="rounded-xl border border-border bg-background px-4">
          <div className="flex items-start gap-3 py-4">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border ${
                isPrivate ? "bg-surface text-foreground-secondary" : "bg-surface text-emerald-700"
              }`}
              aria-hidden
            >
              {isPrivate ? <LockClosedIcon className="h-5 w-5" /> : <GlobeAltIcon className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground font-sans">
                {isPrivate ? "Private collection" : "Public collection"}
              </p>
              <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
                {isPrivate
                  ? "Only people with the link can view. Turn off to list it on your public profile."
                  : "Listed on your profile and discoverable on SPORTSHUB. Turn on to keep it link-only."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              aria-label="Private collection"
              disabled={privacyUpdating || loading}
              onClick={() => {
                void onTogglePrivacy(!isPrivate);
              }}
              className={`relative shrink-0 h-5 w-9 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${
                isPrivate ? "bg-accent" : "bg-surface-muted"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
                  isPrivate ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <EventHubPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit collection"
        footer={
          <EventHubPrimaryButton type="submit" form={EDIT_FORM_ID} disabled={savingEdit || loading || !draftName.trim()}>
            <CheckIcon className="h-4 w-4" aria-hidden />
            Save changes
          </EventHubPrimaryButton>
        }
      >
        <form id={EDIT_FORM_ID} onSubmit={handleEditSubmit} className="space-y-6">
          <label className="block">
            <span className="text-xs font-medium text-foreground-muted font-sans">Name</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base font-semibold text-foreground font-sans focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-foreground-muted font-sans">Description</span>
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans leading-relaxed focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus resize-y min-h-[7rem]"
            />
          </label>
        </form>
      </EventHubPanel>

      <CollectionChangePhotoPanel
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        image={image}
        onSaveImage={onSaveImage}
      />
    </EventHubStage>
  );
}

function CollectionChangePhotoPanel({
  open,
  onClose,
  image,
  onSaveImage,
}: {
  open: boolean;
  onClose: () => void;
  image: string;
  onSaveImage: (imageUrl: string) => Promise<void>;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [draftImage, setDraftImage] = useState<string | undefined>(image || undefined);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user.userId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const images = await getUsersEventImagesUrls(user.userId);
        if (!active) return;
        setImageUrls(image ? [image, ...images.filter((url) => url !== image)] : images);
        setDraftImage(image || undefined);
        setDirty(false);
        setErrorMessage(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, user.userId, image]);

  const handleUpload = async (file: File) => {
    const config = ImageConfig[ImageType.IMAGE];
    if (!config.supportedTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image file (jpg, png).");
      return;
    }
    try {
      let fileToUpload = file;
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB >= 2) {
        const imageCompression = (await import("browser-image-compression")).default;
        fileToUpload = await imageCompression(file, { maxSizeMB: 2, useWebWorker: true });
      }
      const downloadUrl = await uploadEventImage(user.userId, fileToUpload);
      setImageUrls((prev) => [downloadUrl, ...prev.filter((url) => url !== downloadUrl)]);
      setDraftImage(downloadUrl);
      setDirty(true);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Failed to upload the image. Please try again.");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSaveImage(draftImage || "");
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
          Save photo
        </EventHubPrimaryButton>
      }
    >
      <ImagePickerReveal loading={loading} variant="image-only">
        <div className="space-y-4 pb-4">
          <p className="text-xs text-foreground-muted font-sans">
            If upload stalls, close and reopen the browser, then try again.
          </p>
          <ImageSection
            type={ImageType.IMAGE}
            imageUrls={imageUrls.slice(0, 8)}
            onImageUploaded={handleUpload}
            gridCols="grid-cols-2"
            selectedImageUrl={draftImage}
            onImageSelect={(url) => {
              setDraftImage(draftImage === url ? undefined : url);
              setDirty(true);
            }}
          />
          {errorMessage ? <p className="text-sm text-danger font-sans">{errorMessage}</p> : null}
        </div>
      </ImagePickerReveal>
    </EventHubPanel>
  );
}
