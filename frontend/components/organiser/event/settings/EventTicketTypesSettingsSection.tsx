"use client";

import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { useUser } from "@/components/utility/UserContext";
import { useEventOrderAndTickets } from "@/hooks/useEventOrderAndTickets";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { FormId } from "@/interfaces/FormTypes";
import { updateEventById } from "@/services/src/events/eventsService";
import {
  applyCapacityChange,
  countSoldTicketsForType,
  createEventTicketType,
  GENERAL_TICKET_TYPE_NAME,
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveEventInventory,
  resolveFormIdForTicketType,
  syncEventAggregatesFromTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { centsToDollars, dollarsToCents, getEventPriceDisplay } from "@/utilities/priceUtils";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { EventTicketTypeFormDialog } from "./EventTicketTypeFormDialog";

export type EventTicketTypesLegacyEventData = {
  price: number;
  capacity: number;
  vacancy: number;
  formId: FormId | null;
  eventTicketTypes?: EventTicketTypesMap;
};

interface EventTicketTypesSettingsSectionProps {
  eventId: EventId;
  eventData: EventTicketTypesLegacyEventData;
  eventTicketTypes: EventTicketTypesMap | undefined;
  setEventTicketTypes: (types: EventTicketTypesMap | undefined) => void;
  setEventCapacity: (capacity: number) => void;
  setEventVacancy: (vacancy: number) => void;
  setEventPrice: (price: number) => void;
  onSavingChange?: (saving: boolean) => void;
  /** When set (e.g. recurring templates), saves via this instead of updateEventById. */
  onPersistTicketTypes?: (nextTypes: EventTicketTypesMap) => Promise<void>;
}

export function EventTicketTypesSettingsSection({
  eventId,
  eventData,
  eventTicketTypes,
  setEventTicketTypes,
  setEventCapacity,
  setEventVacancy,
  setEventPrice,
  onSavingChange,
  onPersistTicketTypes,
}: EventTicketTypesSettingsSectionProps) {
  const { user } = useUser();
  const { orderTicketsMap } = useEventOrderAndTickets(eventId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<EventTicketTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedTypes = useMemo(() => getSortedEventTicketTypes(eventTicketTypes), [eventTicketTypes]);
  const canDeleteAnyTicketType = sortedTypes.length > 1;
  const editingType = editingId && eventTicketTypes ? eventTicketTypes[editingId] : undefined;

  const persistTicketTypes = async (
    nextTypes: EventTicketTypesMap,
    options?: { syncEventFormId?: boolean; formId?: FormId | null }
  ) => {
    onSavingChange?.(true);
    setError(null);
    try {
      if (onPersistTicketTypes) {
        await onPersistTicketTypes(nextTypes);
      } else {
        await updateEventById(eventId, {
          eventTicketTypes: nextTypes,
          ...(options?.syncEventFormId ? { formId: options.formId ?? null } : {}),
        });
      }
      setEventTicketTypes(nextTypes);
      // Local organiser UI still mirrors aggregates for legacy banners; ticket types are source of truth in Firestore.
      const aggregates = syncEventAggregatesFromTicketTypes(nextTypes);
      setEventPrice(aggregates.price);
      setEventCapacity(aggregates.capacity);
      setEventVacancy(aggregates.vacancy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save ticket types");
      throw e;
    } finally {
      onSavingChange?.(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: EventTicketTypeId) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleSaveType = async (values: {
    name: string;
    priceDollars: number;
    capacity: number;
    formId: FormId | null;
  }) => {
    const price = values.priceDollars <= 0 ? 0 : dollarsToCents(values.priceDollars);
    const current = eventTicketTypes ?? {};
    const syncEventFormId = values.name === GENERAL_TICKET_TYPE_NAME;

    if (editingId && current[editingId]) {
      const existing = current[editingId];
      const updatedType = applyCapacityChange(
        {
          ...existing,
          name: values.name,
          price,
          formId: values.formId,
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
      setError(`Cannot delete "${eventTicketTypes[id].name}" because ${sold} ticket(s) have already been sold.`);
      return;
    }
    const confirmed = window.confirm(`Delete ticket type "${eventTicketTypes[id].name}"? This cannot be undone.`);
    if (!confirmed) return;

    const { [id]: _removed, ...rest } = eventTicketTypes;
    await persistTicketTypes(rest);
  };

  if (!hasEventTicketTypes({ eventTicketTypes })) {
    const inventory = resolveEventInventory(eventData);
    return (
      <div className="flex flex-col gap-3 border border-gray-200 rounded-xl p-4 bg-white">
        <div>
          <h3 className="font-bold text-lg">Ticket Types</h3>
          <p className="text-core-text font-light text-sm mt-1">
            This event does not have ticket types yet. Edit price and capacity from event details, or contact support
            if inventory looks wrong.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Current inventory: {getEventPriceDisplay(inventory.price)} · {inventory.vacancy} of {inventory.capacity}{" "}
            remaining
          </p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex flex-row items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Ticket Types</h3>
          <p className="text-core-text font-light text-sm mt-1">
            Manage pricing, capacity, and forms for each ticket type. Buyers select one type per checkout.
          </p>
        </div>
        <InvertedHighlightButton text="Add Type" onClick={handleAdd} className="shrink-0" />
      </div>

      <div className="flex flex-col gap-3">
        {sortedTypes.map(({ eventTicketTypeId, eventTicketType }) => {
          const sold = countSoldTicketsForType(orderTicketsMap, eventTicketTypeId, eventTicketTypes);
          const canDelete = canDeleteAnyTicketType && sold === 0;
          return (
            <div
              key={eventTicketTypeId}
              className="flex flex-row items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{eventTicketType.name}</span>
                <p className="text-sm text-gray-700 mt-1">
                  {getEventPriceDisplay(eventTicketType.price)} · {sold} sold · {eventTicketType.vacancy} remaining of{" "}
                  {eventTicketType.capacity}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 whitespace-nowrap">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => handleEdit(eventTicketTypeId)}
                  aria-label={`Edit ${eventTicketType.name}`}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    onClick={() => void handleDelete(eventTicketTypeId)}
                    aria-label={`Delete ${eventTicketType.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <EventTicketTypeFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Ticket Type" : "Add Ticket Type"}
        initialValues={
          editingType
            ? {
                name: editingType.name,
                priceDollars: centsToDollars(editingType.price),
                capacity: editingType.capacity,
                formId: resolveFormIdForTicketType(
                  { formId: eventData.formId, eventTicketTypes },
                  editingId
                ),
              }
            : {
                name: "",
                priceDollars: 1,
                capacity: 20,
                formId: null,
              }
        }
        user={user}
        onSave={handleSaveType}
      />
    </div>
  );
}
