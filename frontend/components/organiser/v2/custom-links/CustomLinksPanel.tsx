"use client";

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
  CheckIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
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

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export const CustomLinksPanel = forwardRef<CustomLinksPanelHandle, CustomLinksPanelProps>(function CustomLinksPanel(
  { user, activeEvents, activeRecurringTemplates, links, setLinks },
  ref,
) {
  const [updatedLinks, setUpdatedLinks] = useState<Record<string, CustomEventLink>>(links);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setUpdatedLinks(links);
  }, [links]);

  const handleEdit = (id: string) => {
    setFormError(null);
    setEditIds((prev) => [...prev, id]);
  };

  const handleAddLink = () => {
    const newId = uuidv4();
    const newLink: CustomEventLink = {
      ...EMPTY_CUSTOM_EVENT_LINK,
      id: newId,
    };
    setFormError(null);
    setUpdatedLinks((prev) => ({ ...prev, [newId]: newLink }));
    setEditIds((prev) => [...prev, newId]);
  };

  useImperativeHandle(ref, () => ({ addLink: handleAddLink }));

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

    if (!link.referenceId) {
      setFormError(`Select a ${link.type === "event" ? "event" : "recurring template"}.`);
      return false;
    }

    return true;
  };

  const handleSave = async (id: string) => {
    const updatedLink = updatedLinks[id];
    if (!validateCustomLink(updatedLink)) {
      return;
    }

    setSavingId(id);
    setFormError(null);
    try {
      await saveCustomEventLink(user.userId, updatedLink);
      setEditIds((prev) => prev.filter((editId) => editId !== id));
      setLinks({ ...links, [id]: updatedLink });
    } catch (error) {
      console.error("Error saving custom event link:", error);
      setFormError("Could not save this link. Try again.");
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = (id: string) => {
    setFormError(null);
    setEditIds((prev) => prev.filter((editId) => editId !== id));
    if (Object.keys(links).includes(id)) {
      setUpdatedLinks({ ...updatedLinks, [id]: links[id] });
    } else {
      const updatedLinkCopy = { ...updatedLinks };
      delete updatedLinkCopy[id];
      setUpdatedLinks(updatedLinkCopy);
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

  const handleDelete = async (id: string) => {
    const link = updatedLinks[id];
    const confirmed = window.confirm(`Delete “${link.customEventLinkName || link.customEventLink}”?`);
    if (!confirmed) return;

    try {
      await deleteCustomEventLink(user.userId, link);
    } catch (error) {
      console.error("Error deleting custom event link:", error);
      setFormError("Could not delete this link. Try again.");
      return;
    }
    const updatedLinkCopy = { ...updatedLinks };
    delete updatedLinkCopy[id];
    setUpdatedLinks(updatedLinkCopy);
    const linksCopy = { ...links };
    delete linksCopy[id];
    setLinks(linksCopy);
    setEditIds((prev) => prev.filter((editId) => editId !== id));
  };

  const handleFieldChange = <T extends keyof CustomEventLink>(
    id: string,
    field: T,
    value: CustomEventLink[T],
  ) => setUpdatedLinks((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const applyReference = (id: string, type: CustomEventLinkType, referenceId: string) => {
    setUpdatedLinks((prev) => {
      if (!referenceId) {
        return {
          ...prev,
          [id]: {
            ...prev[id],
            referenceId: null,
            referenceName: null,
            eventReference: null,
          },
        };
      }

      if (type === "event") {
        const event = activeEvents.find((item) => item.eventId === referenceId);
        return {
          ...prev,
          [id]: {
            ...prev[id],
            referenceId,
            referenceName: event?.name ?? null,
            eventReference: referenceId,
          },
        };
      }

      const template = activeRecurringTemplates.find((item) => item.recurrenceTemplateId === referenceId);
      const latestOccurrence = Object.entries(template?.recurrenceData.pastRecurrences ?? {})
        .map(([dateStr, occurrenceId]) => ({ date: new Date(dateStr), id: occurrenceId }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      return {
        ...prev,
        [id]: {
          ...prev[id],
          referenceId,
          referenceName: template?.eventData.name ?? null,
          eventReference: latestOccurrence?.id ?? null,
        },
      };
    });
  };

  const linkList = Object.values(updatedLinks);

  return (
    <section aria-label="Custom event links" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10 space-y-4">
      <p className="text-xs text-foreground-muted font-sans">
        Public URL format:{" "}
        <span className="text-foreground-secondary">
          {getUrlWithCurrentHostname(`/event/${user.username || "username"}/`)}
          <span className="text-foreground">your-slug</span>
        </span>
      </p>

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground font-sans"
        >
          {formError}
        </div>
      ) : null}

      {linkList.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
          <LinkIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
          <p className="mt-4 text-sm font-semibold text-foreground font-sans">No custom links yet</p>
          <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm mx-auto">
            Create a short slug that points to an upcoming event or active recurring template.
          </p>
          <button
            type="button"
            onClick={handleAddLink}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Add link
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
          {linkList.map((link) => {
            const isEditing = editIds.includes(link.id);
            const fullUrl = getUrlWithCurrentHostname(`/event/${user.username}/${link.customEventLink}`);

            if (isEditing) {
              return (
                <div key={link.id} className="p-4 sm:p-5 space-y-3 bg-surface/40">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-foreground-muted font-sans">Name</span>
                      <input
                        className={fieldClass}
                        value={link.customEventLinkName}
                        onChange={(e) => handleFieldChange(link.id, "customEventLinkName", e.target.value)}
                        placeholder="Friday social"
                        maxLength={50}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-foreground-muted font-sans">Slug</span>
                      <input
                        className={fieldClass}
                        value={link.customEventLink}
                        onChange={(e) =>
                          handleFieldChange(
                            link.id,
                            "customEventLink",
                            e.target.value.toLowerCase().replace(/\s/g, ""),
                          )
                        }
                        placeholder="friday-social"
                        maxLength={30}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-foreground-muted font-sans">Type</span>
                      <select
                        className={selectClass}
                        value={link.type}
                        onChange={(e) => {
                          const nextType = e.target.value as CustomEventLinkType;
                          handleFieldChange(link.id, "type", nextType);
                          handleFieldChange(link.id, "referenceId", null);
                          handleFieldChange(link.id, "referenceName", null);
                          handleFieldChange(link.id, "eventReference", null);
                        }}
                      >
                        <option value="event">Event</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-foreground-muted font-sans">
                        {link.type === "event" ? "Event" : "Recurring template"}
                      </span>
                      <select
                        className={selectClass}
                        value={link.referenceId ?? ""}
                        onChange={(e) => applyReference(link.id, link.type, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {link.type === "event"
                          ? activeEvents.map((event) => (
                              <option key={event.eventId} value={event.eventId}>
                                {event.name}
                              </option>
                            ))
                          : activeRecurringTemplates.map((template) => (
                              <option key={template.recurrenceTemplateId} value={template.recurrenceTemplateId}>
                                {template.eventData.name}
                              </option>
                            ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        void handleSave(link.id);
                      }}
                      disabled={savingId === link.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
                    >
                      <CheckIcon className="h-4 w-4" aria-hidden />
                      {savingId === link.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(link.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={link.id}
                className="flex flex-col gap-3 p-2.5 sm:p-3 sm:flex-row sm:items-center sm:gap-3 hover:bg-surface-hover transition-colors"
              >
                  <div className="min-w-0 flex-1 py-0.5 px-1 sm:px-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">
                        {link.customEventLinkName}
                      </p>
                      <span className="shrink-0 rounded-lg bg-surface px-2 py-0.5 text-xs font-medium text-foreground-secondary font-sans">
                        {link.type === "event" ? "Event" : "Recurring"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted font-sans truncate">{fullUrl}</p>
                    <p className="mt-0.5 text-xs text-foreground-muted font-sans truncate">
                      Points to: {link.referenceName || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(link.id)}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label={`Edit ${link.customEventLinkName}`}
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyLink(link.id, link.customEventLink);
                      }}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label={copiedId === link.id ? "Copied" : `Copy ${link.customEventLinkName}`}
                    >
                      {copiedId === link.id ? (
                        <CheckIcon className="h-4 w-4 text-foreground" aria-hidden />
                      ) : (
                        <DocumentDuplicateIcon className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(link.id);
                      }}
                      className="rounded-lg p-2 text-foreground-secondary hover:bg-surface-muted hover:text-danger transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label={`Delete ${link.customEventLinkName}`}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});
