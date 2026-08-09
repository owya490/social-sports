"use client";
import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getPurchaserEmailHash } from "@/services/src/events/eventsService";
import { getAttachedFormIdsForEvent } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getForm, loadAttendeeFormResponse } from "@/services/src/forms/formsServices";
import { collectAttendeeFormResponseLookups } from "@/services/src/forms/formsUtils/formsUtils";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

interface ViewAttendeeFormResponsesDialogProps {
  onClose: () => void;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventData: EventData;
  eventMetadata: EventMetadata;
}

type FormResponseGroup = {
  formId: FormId;
  form: Form;
  formResponses: FormResponse[];
};

export const ViewAttendeeFormResponsesDialog = ({
  onClose,
  orderTicketsMap,
  eventData,
  eventMetadata,
}: ViewAttendeeFormResponsesDialogProps) => {
  const logger = useMemo(() => new Logger("ViewAttendeeFormResponsesDialog"), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<FormResponseGroup[]>([]);

  const lookups = useMemo(() => {
    const collected: ReturnType<typeof collectAttendeeFormResponseLookups> = [];
    const seen = new Set<FormResponseId>();
    orderTicketsMap.forEach((tickets, order) => {
      const legacyAttendee =
        eventMetadata.purchaserMap?.[getPurchaserEmailHash(order.email)]?.attendees?.[order.fullName];
      const legacyIds = legacyAttendee?.formResponseIds ?? [];
      for (const lookup of collectAttendeeFormResponseLookups(eventData, tickets, legacyIds)) {
        if (seen.has(lookup.formResponseId)) {
          continue;
        }
        seen.add(lookup.formResponseId);
        collected.push(lookup);
      }
    });
    return collected;
  }, [eventData, eventMetadata.purchaserMap, orderTicketsMap]);

  useEffect(() => {
    const fetchFormResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        if (lookups.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const loaded = await Promise.all(
          lookups.map((lookup) =>
            loadAttendeeFormResponse(eventData, eventData.eventId, lookup.formResponseId, lookup.formId)
          )
        );

        const byFormId = new Map<FormId, FormResponse[]>();
        for (const item of loaded) {
          if (!item) {
            continue;
          }
          const existing = byFormId.get(item.formId) ?? [];
          existing.push(item.formResponse);
          byFormId.set(item.formId, existing);
        }

        const nextGroups: FormResponseGroup[] = [];
        for (const [formId, formResponses] of byFormId) {
          const form = await getForm(formId);
          nextGroups.push({ formId, form, formResponses });
        }
        setGroups(nextGroups);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    void fetchFormResponses();
  }, [eventData, lookups, logger]);

  const attendeeNames = Array.from(orderTicketsMap.keys())
    .map((order) => order.fullName)
    .join(", ");

  const hasAnyAttachedForm = getAttachedFormIdsForEvent(eventData).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-core-text">Form Responses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Attendee: <span className="font-medium">{attendeeNames}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading form responses...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {lookups.length === 0
                  ? hasAnyAttachedForm
                    ? "No form responses found for this attendee"
                    : "No form is attached to this event"
                  : "No form responses found for this attendee"}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.formId} className="space-y-2">
                {groups.length > 1 ? (
                  <p className="text-sm font-medium text-gray-700">Form: {group.form.title}</p>
                ) : group.form.title ? (
                  <p className="text-xs text-gray-500">Form: {group.form.title}</p>
                ) : null}
                <FormResponsesTable
                  formResponses={group.formResponses}
                  formId={group.formId}
                  form={group.form}
                  eventId={eventData.eventId}
                  orderTicketsMap={orderTicketsMap}
                  showPurchaserColumn={false}
                />
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <BlackHighlightButton onClick={onClose} text="Close" />
        </div>
      </div>
    </div>
  );
};
