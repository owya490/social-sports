"use client";

import { ImageSelectionDialog } from "@/components/forms/sections/image-section/ImageSelectionDialog";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import {
  EventHubGhostButton,
  EventHubPrimaryButton,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { useUser } from "@/components/utility/UserContext";
import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { ImageType } from "@/interfaces/ImageTypes";
import { getUsersEventImagesUrls, uploadEventImage } from "@/services/src/images/imageService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PhotoIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { CollectionHubShareControl } from "./CollectionHubShareControl";

const EDIT_FORM_ID = "collection-hub-edit-form";

type CollectionHubDetailsProps = {
  loading: boolean;
  collectionId: EventCollectionId;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  eventCount: number;
  templateCount: number;
  isPrivate: boolean;
  onSaveDetails: (data: { name: string; description: string }) => Promise<void>;
  onSaveImage: (imageUrl: string) => Promise<void>;
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
  isPrivate,
  onSaveDetails,
  onSaveImage,
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
      ? "No events yet"
      : [
          eventCount > 0 ? `${eventCount} event${eventCount === 1 ? "" : "s"}` : null,
          templateCount > 0 ? `${templateCount} recurring` : null,
        ]
          .filter(Boolean)
          .join(" · ");

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
              <h3 className="text-base font-semibold text-foreground font-sans">About</h3>
              {loading ? (
                <Skeleton count={3} className="mt-2" />
              ) : (
                <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed whitespace-pre-wrap">
                  {description || "No description yet."}
                </p>
              )}
            </div>

            <ul className="space-y-4 border-t border-border pt-4">
              <li className="flex gap-3 items-start">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                  aria-hidden
                >
                  <RectangleStackIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground font-sans">
                    {loading ? "…" : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
                  </p>
                  <p className="text-sm text-foreground-secondary font-sans">
                    {loading ? "…" : membershipLine || "Add events on the Events tab"}
                  </p>
                </div>
              </li>

              <li className="flex gap-3 items-start">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground-muted"
                  aria-hidden
                >
                  {isPrivate ? <LockClosedIcon className="h-5 w-5" /> : <GlobeAltIcon className="h-5 w-5" />}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground font-sans">
                    {isPrivate ? "Private" : "Public"}
                  </p>
                  <p className="text-sm text-foreground-secondary font-sans">
                    {isPrivate
                      ? "Only people with the link can view."
                      : "Listed on your profile and discoverable on SPORTSHUB."}
                  </p>
                </div>
              </li>
            </ul>
          </div>
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
        <p className="mt-1 text-xs text-foreground-muted font-sans mb-3">
          How people can find this collection on SPORTSHUB. Change this in Settings.
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
                  ? " — Only people with the link can view this collection."
                  : " — This collection is listed on your profile and discoverable on SPORTSHUB."}
              </span>
            </p>
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

      <ImageSelectionDialog
        isOpen={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onImageSelected={async (imageUrl) => {
          await onSaveImage(imageUrl);
          setPhotoOpen(false);
        }}
        imageType={ImageType.IMAGE}
        imageUrls={[]}
        onLoadImages={async () => await getUsersEventImagesUrls(user.userId)}
        onUploadImage={async (file: File) => await uploadEventImage(user.userId, file)}
        title="Select collection image"
        buttonText="Save image"
      />
    </EventHubStage>
  );
}
