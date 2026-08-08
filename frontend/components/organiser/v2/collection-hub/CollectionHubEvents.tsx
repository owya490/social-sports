"use client";

import { OrganiserEventRow, OrganiserEventRowSkeleton } from "@/components/organiser/v2/events/OrganiserEventRow";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import {
  EventHubEmpty,
  EventHubFilters,
  EventHubPrimaryButton,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { RecurringTemplateRow, RecurringTemplateRowSkeleton } from "@/components/organiser/v2/recurring/RecurringTemplateRow";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplate, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

type MembershipFilter = "events" | "recurring";

type CollectionHubEventsProps = {
  loading: boolean;
  events: EventData[];
  templates: RecurrenceTemplate[];
  allOrganiserEvents: EventData[];
  allOrganiserTemplates: RecurrenceTemplate[];
  loadingCatalogue: boolean;
  onOpenAdd: (filter: MembershipFilter) => Promise<void>;
  onSaveMembership: (eventIds: EventId[], templateIds: RecurrenceTemplateId[]) => Promise<void>;
  onRemoveEvent: (eventId: EventId) => Promise<void>;
  onRemoveTemplate: (templateId: RecurrenceTemplateId) => Promise<void>;
  selectedEventIds: Set<EventId>;
  selectedTemplateIds: Set<RecurrenceTemplateId>;
  onToggleEvent: (eventId: EventId) => void;
  onToggleTemplate: (templateId: RecurrenceTemplateId) => void;
  addOpen: boolean;
  onCloseAdd: () => void;
  addFilter: MembershipFilter;
  savingAdd: boolean;
};

export function CollectionHubEvents({
  loading,
  events,
  templates,
  allOrganiserEvents,
  allOrganiserTemplates,
  loadingCatalogue,
  onOpenAdd,
  onSaveMembership,
  onRemoveEvent,
  onRemoveTemplate,
  selectedEventIds,
  selectedTemplateIds,
  onToggleEvent,
  onToggleTemplate,
  addOpen,
  onCloseAdd,
  addFilter,
  savingAdd,
}: CollectionHubEventsProps) {
  const [filter, setFilter] = useState<MembershipFilter>("events");

  const filterTabs = useMemo(
    () => [
      { id: "events", label: "Events", count: events.length },
      { id: "recurring", label: "Recurring", count: templates.length },
    ],
    [events.length, templates.length]
  );

  const handleFilterChange = (id: string) => {
    setFilter(id as MembershipFilter);
  };

  const selectedCount = addFilter === "events" ? selectedEventIds.size : selectedTemplateIds.size;

  return (
    <EventHubStage>
      <EventHubFilters
        tabs={filterTabs}
        activeId={filter}
        onChange={handleFilterChange}
        action={
          <EventHubPrimaryButton
            onClick={() => {
              void onOpenAdd(filter);
            }}
            disabled={loading}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add
          </EventHubPrimaryButton>
        }
      />

      {filter === "events" ? (
        loading ? (
          <div className="divide-y divide-border border-b border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <OrganiserEventRowSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EventHubEmpty>
            No events in this collection yet. Tap Add to include one-off sessions.
          </EventHubEmpty>
        ) : (
          <ul className="divide-y divide-border border-b border-border">
            {events.map((event) => (
              <li key={event.eventId} className="relative group flex items-stretch">
                <div className="min-w-0 flex-1">
                  <OrganiserEventRow event={event} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void onRemoveEvent(event.eventId);
                  }}
                  className="shrink-0 self-center mr-2 sm:mr-3 inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-danger hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove ${event.name} from collection`}
                >
                  <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : loading ? (
        <div className="divide-y divide-border border-b border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <RecurringTemplateRowSkeleton key={i} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EventHubEmpty>
          No recurring templates in this collection yet. Tap Add to include a series.
        </EventHubEmpty>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {templates.map((template) => (
            <li key={template.recurrenceTemplateId} className="relative group flex items-stretch">
              <div className="min-w-0 flex-1">
                <RecurringTemplateRow template={template} />
              </div>
              <button
                type="button"
                onClick={() => {
                  void onRemoveTemplate(template.recurrenceTemplateId);
                }}
                className="shrink-0 self-center mr-2 sm:mr-3 inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-danger hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Remove ${template.eventData.name} from collection`}
              >
                <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <EventHubPanel
        open={addOpen}
        onClose={onCloseAdd}
        title={addFilter === "events" ? "Add events" : "Add recurring"}
        wide
        footer={
          <EventHubPrimaryButton
            onClick={() => {
              void onSaveMembership(Array.from(selectedEventIds), Array.from(selectedTemplateIds));
            }}
            disabled={savingAdd || loadingCatalogue}
          >
            <CheckIcon className="h-4 w-4" aria-hidden />
            Save selection ({selectedCount})
          </EventHubPrimaryButton>
        }
      >
        {loadingCatalogue ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : addFilter === "events" ? (
          allOrganiserEvents.length === 0 ? (
            <EventHubEmpty>Create events first to add them to this collection.</EventHubEmpty>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {allOrganiserEvents.map((event) => {
                const selected = selectedEventIds.has(event.eventId);
                const thumb = event.thumbnail || event.image;
                return (
                  <li key={event.eventId}>
                    <button
                      type="button"
                      onClick={() => onToggleEvent(event.eventId)}
                      className={`flex w-full items-center gap-3 px-1 py-3 text-left rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                        selected ? "bg-surface-muted" : "hover:bg-surface-hover"
                      }`}
                      aria-pressed={selected}
                    >
                      <div
                        className="h-12 w-12 shrink-0 rounded-lg border border-border bg-surface-muted bg-cover bg-center"
                        style={{ backgroundImage: thumb ? `url(${thumb})` : undefined }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground font-sans truncate">{event.name}</p>
                        <p className="text-xs text-foreground-muted font-sans truncate mt-0.5">
                          {timestampToEventCardDateString(event.startDate)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background"
                        }`}
                        aria-hidden
                      >
                        {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : allOrganiserTemplates.length === 0 ? (
          <EventHubEmpty>Create recurring templates first to add them to this collection.</EventHubEmpty>
        ) : (
          <ul className="divide-y divide-border -mx-1">
            {allOrganiserTemplates.map((template) => {
              const selected = selectedTemplateIds.has(template.recurrenceTemplateId);
              const thumb = template.eventData.thumbnail || template.eventData.image;
              return (
                <li key={template.recurrenceTemplateId}>
                  <button
                    type="button"
                    onClick={() => onToggleTemplate(template.recurrenceTemplateId)}
                    className={`flex w-full items-center gap-3 px-1 py-3 text-left rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                      selected ? "bg-surface-muted" : "hover:bg-surface-hover"
                    }`}
                    aria-pressed={selected}
                  >
                    <div
                      className="h-12 w-12 shrink-0 rounded-lg border border-border bg-surface-muted bg-cover bg-center"
                      style={{ backgroundImage: thumb ? `url(${thumb})` : undefined }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground font-sans truncate">
                        {template.eventData.name}
                      </p>
                      <p className="text-xs text-foreground-muted font-sans truncate mt-0.5">
                        {timestampToEventCardDateString(template.eventData.startDate)}
                        {template.eventData.location ? ` · ${template.eventData.location}` : ""}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background"
                      }`}
                      aria-hidden
                    >
                      {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </EventHubPanel>
    </EventHubStage>
  );
}
