import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { EventData, EventId, EventMetadata, Purchaser } from "@/interfaces/EventTypes";
import { FormId, FormResponse } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getEventById } from "@/services/src/events/eventsService";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface ViewAttendeeFormResponsesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attendeeName: string;
  purchaser: Purchaser;
  eventId: EventId;
  eventMetadata: EventMetadata;
}

const ViewAttendeeFormResponsesDialog = ({
  isOpen,
  onClose,
  attendeeName,
  purchaser,
  eventId,
  eventMetadata,
}: ViewAttendeeFormResponsesDialogProps) => {
  const logger = new Logger("ViewAttendeeFormResponsesDialog");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [formTitle, setFormTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get event data to find formId
        const eventData: EventData = await getEventById(eventId);
        if (!eventData.formId) {
          setFormId(null);
          setLoading(false);
          return;
        }

        setFormId(eventData.formId);

        // Get form title
        const form = await getForm(eventData.formId);
        setFormTitle(form.title);

        // Get all form responses for this event
        const allResponses = await getFormResponsesForEvent(eventData.formId, eventId);

        // Filter responses for this specific attendee
        const attendeeData = purchaser.attendees[attendeeName];
        const attendeeFormResponseIds = attendeeData.formResponseIds || [];

        const filteredResponses = allResponses.filter((response) =>
          attendeeFormResponseIds.includes(response.formResponseId)
        );

        setFormResponses(filteredResponses);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchFormResponses();
    }
  }, [isOpen, eventId, attendeeName, purchaser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-core-text">Form Responses</h2>
            <p className="text-sm text-gray-600 mt-1">
              Attendee: <span className="font-medium">{attendeeName}</span>
            </p>
            {formTitle && <p className="text-xs text-gray-500 mt-0.5">Form: {formTitle}</p>}
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
          ) : formResponses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No form responses found for this attendee</p>
            </div>
          ) : (
            <FormResponsesTable
              formResponses={formResponses}
              formId={formId}
              eventId={eventId}
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

export default ViewAttendeeFormResponsesDialog;
