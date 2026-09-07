"use client";

import {
  EventTicketTypeFormDialog,
  EventTicketTypeFormValues,
} from "@/components/organiser/event/settings/EventTicketTypeFormDialog";
import { useUser } from "@/components/utility/UserContext";
import { useEventOrderAndTickets } from "@/hooks/useEventOrderAndTickets";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { updateEventById } from "@/services/src/events/eventsService";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import {
  applyCapacityChange,
  countSoldTicketsForType,
  createEventTicketType,
  GENERAL_TICKET_TYPE_NAME,
  getSortedEventTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { centsToDollars, dollarsToCents, getEventPriceDisplay } from "@/utilities/priceUtils";
import { PencilIcon, PlusIcon, TicketIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { EventHubGhostButton, EventHubPrimaryButton } from "./EventHubStage";

type EventHubTicketTypesEditorProps = {
  eventId: EventId;
  eventTicketTypes: EventTicketTypesMap | undefined;
  isActive: boolean;
  setEventTicketTypes: (types: EventTicketTypesMap | undefined) => void;
  /** When set (e.g. recurring templates), saves via this instead of updateEventById. */
  onPersistTicketTypes?: (nextTypes: EventTicketTypesMap) => Promise<void>;
  /** Hide form picker when forms are managed elsewhere (e.g. event hub Registration). */
  hideFormSelector?: boolean;
};

export function EventHubTicketTypesEditor({
  eventId,
  eventTicketTypes,
  isActive,
  setEventTicketTypes,
  onPersistTicketTypes,
  hideFormSelector = true,
}: EventHubTicketTypesEditorProps) {
  const { user } = useUser();
  const { orderTicketsMap } = useEventOrderAndTickets(onPersistTicketTypes ? undefined : eventId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<EventTicketTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedTypes = useMemo(() => getSortedEventTicketTypes(eventTicketTypes), [eventTicketTypes]);
  const canDeleteAnyTicketType = sortedTypes.length > 1;
  const editingType = editingId && eventTicketTypes ? eventTicketTypes[editingId] : undefined;

  const persistTicketTypes = async (
    nextTypes: EventTicketTypesMap,
    options?: { syncEventFormId?: boolean; formId?: FormId | null }
  ) => {
    setError(null);
    setSaving(true);
    try {
      if (onPersistTicketTypes) {
        await onPersistTicketTypes(nextTypes);
      } else {
        await updateEventById(eventId, {
          eventTicketTypes: nextTypes,
          ...(options?.syncEventFormId ? { formId: options.formId ?? null } : {}),
        });
        bustOrganiserEventsCache();
      }
      setEventTicketTypes(nextTypes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save ticket types");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (values: EventTicketTypeFormValues) => {
    const price = values.priceDollars <= 0 ? 0 : dollarsToCents(values.priceDollars);
    const current = eventTicketTypes ?? {};
    const syncEventFormId = !hideFormSelector && values.name === GENERAL_TICKET_TYPE_NAME;

    if (editingId && current[editingId]) {
      const existing = current[editingId];
      const updatedType = applyCapacityChange(
        {
          ...existing,
          name: values.name,
          price,
          formId: values.formId ?? existing.formId ?? null,
        },
        values.capacity
      );
      await persistTicketTypes(
        {
          ...current,
          [editingId]: updatedType,
        },
        { syncEventFormId, formId: values.formId }
      );
    } else {
      const eventTicketType = createEventTicketType({
        name: values.name,
        price,
        capacity: values.capacity,
        formId: values.formId,
      });
      await persistTicketTypes(
        {
          ...current,
          [eventTicketType.id]: eventTicketType,
        },
        { syncEventFormId, formId: values.formId }
      );
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id: EventTicketTypeId) => {
    if (!eventTicketTypes?.[id]) return;
    if (Object.keys(eventTicketTypes).length <= 1) {
      setError("Events must have at least one ticket type.");
      return;
    }
    const sold = countSoldTicketsForType(orderTicketsMap, id, eventTicketTypes);
    if (sold > 0) {
      setError(
        `Cannot delete "${eventTicketTypes[id].name}" because ${sold} ticket(s) have already been sold.`
      );
      return;
    }
    const confirmed = window.confirm(`Delete ticket type "${eventTicketTypes[id].name}"? This cannot be undone.`);
    if (!confirmed) return;
    const { [id]: _removed, ...rest } = eventTicketTypes;
    await persistTicketTypes(rest);
  };

  const openAdd = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2">
          <TicketIcon className="h-4 w-4 text-foreground-muted shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground font-sans">Ticket types</p>
            <p className="text-xs text-foreground-muted font-sans mt-0.5">
              {hideFormSelector
                ? "Set price and capacity per type. Attach forms under Registration."
                : "Set price, capacity, and forms per type."}
            </p>
          </div>
        </div>
        {sortedTypes.length > 0 && isActive ? (
          <EventHubGhostButton onClick={openAdd} disabled={saving}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add
          </EventHubGhostButton>
        ) : null}
      </div>

      {sortedTypes.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-4 py-4 space-y-3">
          <p className="text-sm text-foreground-secondary font-sans">
            {isActive
              ? "Add a ticket type to set price and capacity for this event."
              : "This event has no ticket types. Price and capacity are set on the event."}
          </p>
          {isActive ? (
            <EventHubPrimaryButton onClick={openAdd} disabled={saving}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              Add ticket type
            </EventHubPrimaryButton>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {sortedTypes.map(({ eventTicketTypeId, eventTicketType }) => {
            const sold = countSoldTicketsForType(orderTicketsMap, eventTicketTypeId, eventTicketTypes);
            const canDelete = canDeleteAnyTicketType && sold === 0;
            return (
              <li
                key={eventTicketTypeId}
                className="rounded-xl border border-border bg-background px-3 py-3 flex flex-row items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground font-sans truncate">
                    {eventTicketType.name}
                  </p>
                  <p className="text-xs text-foreground-muted font-sans mt-0.5">
                    {getEventPriceDisplay(eventTicketType.price, true)} · {sold} sold ·{" "}
                    {eventTicketType.vacancy} remaining of {eventTicketType.capacity}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  {isActive ? (
                    <EventHubGhostButton
                      onClick={() => {
                        setEditingId(eventTicketTypeId);
                        setDialogOpen(true);
                      }}
                      disabled={saving}
                      className="whitespace-nowrap"
                    >
                      <PencilIcon className="h-4 w-4 shrink-0" aria-hidden />
                      Edit
                    </EventHubGhostButton>
                  ) : null}
                  {isActive && canDelete ? (
                    <EventHubGhostButton
                      onClick={() => void handleDelete(eventTicketTypeId)}
                      disabled={saving}
                      className="whitespace-nowrap"
                    >
                      <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
                      Delete
                    </EventHubGhostButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? <p className="text-sm text-danger font-sans">{error}</p> : null}

      <EventTicketTypeFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Ticket Type" : "Add Ticket Type"}
        hideFormSelector={hideFormSelector}
        initialValues={
          editingType
            ? {
                name: editingType.name,
                priceDollars: centsToDollars(editingType.price),
                capacity: editingType.capacity,
                formId: editingType.formId ?? null,
              }
            : {
                name: "",
                priceDollars: 1,
                capacity: 20,
                formId: null,
              }
        }
        user={user}
        onSave={handleSave}
      />
    </div>
  );
}
