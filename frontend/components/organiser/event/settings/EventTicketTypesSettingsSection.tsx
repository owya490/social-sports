"use client";

import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { useUser } from "@/components/utility/UserContext";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { updateEventById } from "@/services/src/events/eventsService";
import {
  applyCapacityChange,
  buildEventTicketTypesFromLegacyEvent,
  countSoldTicketsForType,
  createEventTicketType,
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  syncEventAggregatesFromTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS } from "@/services/src/stripe/stripeConstants";
import { centsToDollars, dollarsToCents, getEventPriceDisplay } from "@/utilities/priceUtils";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { EventTicketTypeFormDialog } from "./EventTicketTypeFormDialog";

interface EventTicketTypesSettingsSectionProps {
  eventId: EventId;
  eventData: EventData;
  orderTicketsMap: Map<Order, Ticket[]>;
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
  orderTicketsMap,
  eventTicketTypes,
  setEventTicketTypes,
  setEventCapacity,
  setEventVacancy,
  setEventPrice,
  onSavingChange,
  onPersistTicketTypes,
}: EventTicketTypesSettingsSectionProps) {
  const { user } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<EventTicketTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedTypes = useMemo(() => getSortedEventTicketTypes(eventTicketTypes), [eventTicketTypes]);
  const editingType = editingId && eventTicketTypes ? eventTicketTypes[editingId] : undefined;

  const persistTicketTypes = async (nextTypes: EventTicketTypesMap) => {
    onSavingChange?.(true);
    setError(null);
    try {
      const aggregates = syncEventAggregatesFromTicketTypes(nextTypes);
      if (onPersistTicketTypes) {
        await onPersistTicketTypes(nextTypes);
      } else {
        await updateEventById(eventId, {
          eventTicketTypes: nextTypes,
          price: aggregates.price,
          capacity: aggregates.capacity,
          vacancy: aggregates.vacancy,
        });
      }
      setEventTicketTypes(nextTypes);
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

  const handleEnableTicketTypes = async () => {
    const nextTypes = buildEventTicketTypesFromLegacyEvent({
      price: eventData.price,
      capacity: eventData.capacity,
      vacancy: eventData.vacancy,
      formId: eventData.formId,
    });
    await persistTicketTypes(nextTypes);
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
    description: string;
    priceDollars: number;
    capacity: number;
    formId: FormId | null;
  }) => {
    const price = values.priceDollars <= 0 ? 0 : dollarsToCents(values.priceDollars);
    const current = eventTicketTypes ?? {};

    if (editingId && current[editingId]) {
      const existing = current[editingId];
      const updatedType = applyCapacityChange(
        {
          ...existing,
          name: values.name,
          description: values.description || undefined,
          price,
          formId: values.formId,
        },
        values.capacity
      );
      await persistTicketTypes({
        ...current,
        [editingId]: updatedType,
      });
    } else {
      const { eventTicketTypeId, eventTicketType } = createEventTicketType({
        name: values.name,
        description: values.description || undefined,
        price,
        capacity: values.capacity,
        formId: values.formId,
        sortOrder: sortedTypes.length,
      });
      await persistTicketTypes({
        ...current,
        [eventTicketTypeId]: eventTicketType,
      });
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleDeactivate = async (id: EventTicketTypeId) => {
    if (!eventTicketTypes?.[id]) return;
    const sold = countSoldTicketsForType(orderTicketsMap, id);
    if (sold > 0) {
      const confirmed = window.confirm(
        `${sold} ticket(s) have been sold for this type. Deactivating will hide it from buyers but sold tickets are unaffected. Continue?`
      );
      if (!confirmed) return;
    }
    await persistTicketTypes({
      ...eventTicketTypes,
      [id]: { ...eventTicketTypes[id], isActive: false },
    });
  };

  if (!hasEventTicketTypes({ eventTicketTypes })) {
    return (
      <div className="flex flex-col gap-3 border border-core-outline rounded-xl p-4">
        <div>
          <h3 className="font-bold text-lg">Ticket Types</h3>
          <p className="text-core-text font-light text-sm mt-1">
            Offer multiple ticket types (e.g. Men&apos;s, Women&apos;s) with different pricing, capacity, and
            registration forms. This event currently uses a single price and capacity.
          </p>
        </div>
        <InvertedHighlightButton text="Enable Ticket Types" onClick={() => void handleEnableTicketTypes()} />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-core-outline rounded-xl p-4">
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
          const sold = countSoldTicketsForType(orderTicketsMap, eventTicketTypeId);
          return (
            <div
              key={eventTicketTypeId}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${
                eventTicketType.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-70"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{eventTicketType.name}</span>
                  {!eventTicketType.isActive && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                {eventTicketType.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{eventTicketType.description}</p>
                )}
                <p className="text-sm text-gray-700 mt-1">
                  {getEventPriceDisplay(eventTicketType.price)} · {sold} sold · {eventTicketType.vacancy} remaining
                  of {eventTicketType.capacity}
                  {eventTicketType.formId ? " · Form attached" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => handleEdit(eventTicketTypeId)}
                  aria-label={`Edit ${eventTicketType.name}`}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                {eventTicketType.isActive && (
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    onClick={() => void handleDeactivate(eventTicketTypeId)}
                    aria-label={`Deactivate ${eventTicketType.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
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
                description: editingType.description ?? "",
                priceDollars: centsToDollars(editingType.price),
                capacity: editingType.capacity,
                formId: editingType.formId,
              }
            : {
                name: "",
                description: "",
                priceDollars: centsToDollars(MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS),
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
