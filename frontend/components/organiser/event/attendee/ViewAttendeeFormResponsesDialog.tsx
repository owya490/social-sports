import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getPurchaserEmailHash } from "@/services/src/events/eventsService";
import { getForm, getFormResponse } from "@/services/src/forms/formsServices";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface ViewAttendeeFormResponsesDialogProps {
  onClose: () => void;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventData: EventData;
  eventMetadata: EventMetadata;
}

export const ViewAttendeeFormResponsesDialog = ({
  onClose,
  orderTicketsMap,
  eventData,
  eventMetadata,
}: ViewAttendeeFormResponsesDialogProps) => {
  const logger = new Logger("ViewAttendeeFormResponsesDialog");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  console.log(orderTicketsMap)

  const orderFormResponseIds = new Set<FormResponseId>();
  orderTicketsMap.keys().map((order) => {
    // get formResponseIds on Tickets
    const tickets = orderTicketsMap.get(order)!;
    const ticketFormResponseIds = tickets.map((ticket) => ticket.formResponseId).filter((formResponseId) => formResponseId !== null);
    ticketFormResponseIds.forEach((formResponseId) => orderFormResponseIds.add(formResponseId));

    // get legacy form response Ids in the legacyAttendeeMap
    const legacyAttendee = eventMetadata.purchaserMap[getPurchaserEmailHash(order.email)].attendees[order.fullName];
    const legacyFormResponseIds = legacyAttendee.formResponseIds || [];
    legacyFormResponseIds.forEach((formResponseId: string) => orderFormResponseIds.add(formResponseId as FormResponseId));
  })
  

  useEffect(() => {
    const fetchFormResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get event data to find formId
        if (!eventData.formId) {
          setFormId(null);
          setLoading(false);
          return;
        }

        setFormId(eventData.formId);

        // Get form title
        const form = await getForm(eventData.formId);
        setForm(form);

        const fetchedFormResponses: FormResponse[] = [];

        orderFormResponseIds.forEach(async (formResponseId) => {
          fetchedFormResponses.push(await getFormResponse(eventData.formId as FormId, eventData.eventId, formResponseId));
        })
        
        setFormResponses(fetchedFormResponses || []);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    fetchFormResponses();
  }, [eventData.eventId, orderTicketsMap, eventMetadata]);

  const attendeeNames = Array.from(orderTicketsMap.keys()).map((order) => order.fullName).join(", ");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-core-text">Form Responses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Attendee: <span className="font-medium">{attendeeNames}</span>
            </p>
            {form && <p className="text-xs text-gray-500 mt-0.5">Form: {form.title}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Close">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading form responses...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : !formId ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No form is attached to this event</p>
            </div>
          ) : !form ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No form found for formId: {formId}</p>
              <p className="text-gray-600">Please contact SPORTSHUB support.</p>
            </div>
          ) : formResponses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No form responses found for this attendee</p>
            </div>
          ) : (
            <FormResponsesTable
              formResponses={formResponses}
              formId={formId}
              form={form}
              eventId={eventData.eventId}
              eventMetadata={eventMetadata}
              showPurchaserColumn={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <BlackHighlightButton onClick={onClose} text="Close" />
        </div>
      </div>
    </div>
  );
};
