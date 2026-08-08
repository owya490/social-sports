"use client";

import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { CustomEventLink, CustomEventLinkType, EMPTY_CUSTOM_EVENT_LINK } from "@/interfaces/CustomLinkTypes";
import { EventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  deleteCustomEventLink,
  saveCustomEventLink,
} from "@/services/src/events/customEventLinks/customEventLinksService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import {
  EntityListEmptyPrimaryAction,
  EntityListEmptyState,
} from "@/components/organiser/v2/shared/EntityListEmptyState";
import {
  CheckIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type CustomLinksPanelHandle = {
  addLink: () => void;
};

type CustomLinksPanelProps = {
  user: UserData;
  activeEvents: EventData[];
  activeRecurringTemplates: RecurrenceTemplate[];
  links: Record<string, CustomEventLink>;
  setLinks: (links: Record<string, CustomEventLink>) => void;
};

type DestinationOption = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function typeLabel(type: CustomEventLinkType) {
  return type === "event" ? "Event" : "Series";
}

function resolveReferenceId(link: CustomEventLink): string | null {
  if (link.referenceId) return link.referenceId;
  // Legacy event links sometimes only stored eventReference (= event id).
  if (link.type === "event" && link.eventReference) return link.eventReference;
  return null;
}

function normalizeLink(link: CustomEventLink): CustomEventLink {
  const referenceId = resolveReferenceId(link);
  return { ...link, referenceId };
}

export const CustomLinksPanel = forwardRef<CustomLinksPanelHandle, CustomLinksPanelProps>(function CustomLinksPanel(
  { user, activeEvents, activeRecurringTemplates, links, setLinks },
  ref,
) {
  const [list, setList] = useState<Record<string, CustomEventLink>>(links);
  const [draft, setDraft] = useState<CustomEventLink | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setList(links);
  }, [links]);

  const openDraft = (link: CustomEventLink, isNew: boolean) => {
    setFormError(null);
    setIsNewDraft(isNew);
    setDraft(normalizeLink(link));
  };

  const closePanel = () => {
    setFormError(null);
    setDraft(null);
    setIsNewDraft(false);
  };

  const handleAddLink = () => {
    openDraft({ ...EMPTY_CUSTOM_EVENT_LINK, id: uuidv4() }, true);
  };

  useImperativeHandle(ref, () => ({ addLink: handleAddLink }));

  const destinationOptions = (link: CustomEventLink): DestinationOption[] => {
    const base: DestinationOption[] =
      link.type === "event"
        ? activeEvents.map((event) => ({ id: event.eventId, name: event.name }))
        : activeRecurringTemplates.map((template) => ({
            id: template.recurrenceTemplateId,
            name: template.eventData.name,
          }));

    const referenceId = resolveReferenceId(link);
    if (referenceId && !base.some((option) => option.id === referenceId)) {
      return [
        {
          id: referenceId,
          name: link.referenceName?.trim() || "Current destination (unavailable)",
        },
        ...base,
      ];
    }
    return base;
  };

  const validateCustomLink = (link: CustomEventLink) => {
    const missingFields = [];
    if (!link.customEventLinkName) missingFields.push("name");
    if (!link.customEventLink) missingFields.push("slug");
    if (!link.type) missingFields.push("type");
    if (missingFields.length > 0) {
      setFormError(`Fill in: ${missingFields.join(", ")}.`);
      return false;
    }

    if (link.customEventLinkName.length > 50) {
      setFormError("Name must be 50 characters or fewer.");
      return false;
    }
    if (link.customEventLink.length > 30) {
      setFormError("Slug must be 30 characters or fewer.");
      return false;
    }
    if (link.customEventLinkName.length < 3) {
      setFormError("Name must be at least 3 characters.");
      return false;
    }
    if (link.customEventLink.length < 3) {
      setFormError("Slug must be at least 3 characters.");
      return false;
    }
    if (link.customEventLink !== link.customEventLink.toLowerCase()) {
      setFormError("Slug must be lowercase only.");
      return false;
    }
    if (link.customEventLink.includes(" ")) {
      setFormError("Slug cannot contain spaces.");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(link.customEventLink)) {
      setFormError("Slug may only use lowercase letters, numbers, and hyphens.");
      return false;
    }

    const isNew = !Object.keys(links).includes(link.id);
    const duplicateLink = isNew
      ? Object.values(links).find((l) => l.customEventLink.toLowerCase() === link.customEventLink.toLowerCase())
      : false;
    if (duplicateLink) {
      setFormError(`“${link.customEventLink}” is already in use.`);
      return false;
    }

    if (
      link.customEventLink.startsWith("-") ||
      link.customEventLink.endsWith("-") ||
      link.customEventLink.includes("--")
    ) {
      setFormError("Slug cannot start/end with a hyphen or contain consecutive hyphens.");
      return false;
    }

    if (!resolveReferenceId(link)) {
      setFormError(`Choose which ${link.type === "event" ? "event" : "series"} this link opens.`);
      return false;
    }

    return true;
  };

  const applyReference = (type: CustomEventLinkType, referenceId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (!referenceId) {
        return {
          ...prev,
          type,
          referenceId: null,
          referenceName: null,
          eventReference: null,
        };
      }

      if (type === "event") {
        const event = activeEvents.find((item) => item.eventId === referenceId);
        return {
          ...prev,
          type,
          referenceId,
          referenceName: event?.name ?? prev.referenceName,
          eventReference: referenceId,
        };
      }

      const template = activeRecurringTemplates.find((item) => item.recurrenceTemplateId === referenceId);
      const latestOccurrence = template
        ? Object.entries(template.recurrenceData.pastRecurrences ?? {})
            .map(([dateStr, occurrenceId]) => ({ date: new Date(dateStr), id: occurrenceId }))
            .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
        : undefined;

      return {
        ...prev,
        type,
        referenceId,
        referenceName: template?.eventData.name ?? prev.referenceName,
        // Keep the stored occurrence when the series is no longer in the active list.
        eventReference: latestOccurrence?.id ?? prev.eventReference,
      };
    });
  };

  const handleSave = async () => {
    if (!draft || !validateCustomLink(draft)) return;

    setSaving(true);
    setFormError(null);
    try {
      await saveCustomEventLink(user.userId, draft);
      const next = { ...links, [draft.id]: draft };
      setLinks(next);
      setList(next);
      closePanel();
    } catch (error) {
      console.error("Error saving custom event link:", error);
      setFormError("Could not save this link. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async (id: string, slug: string) => {
    const url = getUrlWithCurrentHostname(`/event/${user.username}/${slug}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      setFormError("Could not copy to clipboard.");
    }
  };

  const handleDelete = async () => {
    if (!draft || isNewDraft) return;
    const confirmed = window.confirm(`Delete “${draft.customEventLinkName || draft.customEventLink}”?`);
    if (!confirmed) return;

    setDeleting(true);
    setFormError(null);
    try {
      await deleteCustomEventLink(user.userId, draft);
      const next = { ...links };
      delete next[draft.id];
      setLinks(next);
      setList(next);
      closePanel();
    } catch (error) {
      console.error("Error deleting custom event link:", error);
      setFormError("Could not delete this link. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const linkList = Object.values(list);
  const baseUrl = getUrlWithCurrentHostname(`/event/${user.username || "username"}/`);
  const panelOpen = draft !== null;
  const draftOptions = draft ? destinationOptions(draft) : [];
  const draftReferenceId = draft ? resolveReferenceId(draft) ?? "" : "";

  return (
    <section aria-label="Custom event links" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10 space-y-4">
      <p className="text-xs text-foreground-muted font-sans">
        Public URL:{" "}
        <span className="text-foreground-secondary">
          {baseUrl}
          <span className="text-foreground">your-slug</span>
        </span>
      </p>

      {formError && !panelOpen ? (
        <div
          role="alert"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground font-sans"
        >
          {formError}
        </div>
      ) : null}

      {linkList.length === 0 ? (
        <EntityListEmptyState
          variant="empty"
          icon={LinkIcon}
          title="No custom links yet"
          description="Create a short URL that opens an upcoming event or active series."
        >
          <EntityListEmptyPrimaryAction onClick={handleAddLink}>Add link</EntityListEmptyPrimaryAction>
        </EntityListEmptyState>
      ) : (
        <ul className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
          {linkList.map((link) => {
            const fullUrl = getUrlWithCurrentHostname(`/event/${user.username}/${link.customEventLink}`);
            const destination = link.referenceName?.trim();

            return (
              <li key={link.id}>
                <div className="flex items-stretch gap-0 hover:bg-surface-hover transition-colors">
                  <button
                    type="button"
                    onClick={() => openDraft(link, false)}
                    className="min-w-0 flex-1 text-left px-3.5 py-3.5 sm:px-4 sm:py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
                    aria-label={`Edit ${link.customEventLinkName || "custom link"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">
                            {link.customEventLinkName || "Untitled link"}
                          </p>
                          <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground-secondary font-sans">
                            {typeLabel(link.type)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground-muted font-sans truncate">{fullUrl}</p>
                        <p className="mt-1.5 text-xs text-foreground-secondary font-sans truncate">
                          {destination ? (
                            <>
                              Opens <span className="text-foreground font-medium">{destination}</span>
                            </>
                          ) : (
                            <span className="text-foreground-muted">No destination set</span>
                          )}
                        </p>
                      </div>
                      <ChevronRightIcon
                        className="mt-1 h-4 w-4 shrink-0 text-foreground-muted"
                        aria-hidden
                      />
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center pr-2 sm:pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyLink(link.id, link.customEventLink);
                      }}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label={copiedId === link.id ? "Copied" : `Copy ${link.customEventLinkName || "link"}`}
                    >
                      {copiedId === link.id ? (
                        <CheckIcon className="h-4 w-4 text-foreground" aria-hidden />
                      ) : (
                        <DocumentDuplicateIcon className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EventHubPanel
        open={panelOpen}
        onClose={closePanel}
        title={isNewDraft ? "New custom link" : "Edit custom link"}
        footer={
          draft ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={saving || deleting}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={closePanel}
                disabled={saving || deleting}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
              >
                Cancel
              </button>
              {!isNewDraft ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleDelete();
                  }}
                  disabled={saving || deleting}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-danger font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              ) : null}
            </div>
          ) : null
        }
      >
        {draft ? (
          <div className="space-y-5">
            {formError ? (
              <div
                role="alert"
                className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-foreground font-sans"
              >
                {formError}
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground-muted font-sans">Name</span>
              <input
                className={fieldClass}
                value={draft.customEventLinkName}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, customEventLinkName: e.target.value } : prev))}
                placeholder="Friday social"
                maxLength={50}
              />
            </label>

            <div className="space-y-1.5">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-foreground-muted font-sans">Slug</span>
                <input
                  className={fieldClass}
                  value={draft.customEventLink}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            customEventLink: e.target.value.toLowerCase().replace(/\s/g, ""),
                          }
                        : prev,
                    )
                  }
                  placeholder="friday-social"
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <p className="text-xs text-foreground-muted font-sans break-all">
                {baseUrl}
                <span className="text-foreground">{draft.customEventLink || "your-slug"}</span>
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-foreground-muted font-sans">What it opens</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "event", label: "Event" },
                    { value: "recurring", label: "Series" },
                  ] as const
                ).map((option) => {
                  const selected = draft.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (draft.type === option.value) return;
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                type: option.value,
                                referenceId: null,
                                referenceName: null,
                                eventReference: null,
                              }
                            : prev,
                        );
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-surface-hover"
                      }`}
                      aria-pressed={selected}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground-muted font-sans">
                {draft.type === "event" ? "Event" : "Series"}
              </span>
              <select
                className={selectClass}
                value={draftReferenceId}
                onChange={(e) => applyReference(draft.type, e.target.value)}
              >
                <option value="">Choose…</option>
                {draftOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {draftReferenceId && draft.referenceName ? (
                <p className="text-xs text-foreground-secondary font-sans">
                  Opens <span className="text-foreground font-medium">{draft.referenceName}</span>
                </p>
              ) : (
                <p className="text-xs text-foreground-muted font-sans">
                  Guests who open this link will land on the {draft.type === "event" ? "event" : "series"} you choose.
                </p>
              )}
            </label>
          </div>
        ) : null}
      </EventHubPanel>
    </section>
  );
});
