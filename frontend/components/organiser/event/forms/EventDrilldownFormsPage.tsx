import { EventMetadata } from "@/interfaces/EventTypes";
import { Form, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { db } from "@/services/src/firebase";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";

interface EventDrilldownFormsPageProps {
  eventMetadata: EventMetadata; 
  eventId: string;
}

const getAnswerDisplay = (section: FormSection | undefined): string | React.JSX.Element => {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
      return section.answer || "—";

    case FormSectionType.MULTIPLE_CHOICE:
      const index = parseInt(section.answer as string);
      return !isNaN(index) && section.options && section.options[index] ? section.options[index] : "—";

    case FormSectionType.DROPDOWN_SELECT:
      return section.answer || "—";

    default:
      return "—";
  }
};

const EventDrilldownFormsPage = ({ eventId }: EventDrilldownFormsPageProps) => {
  const [eventMetadata, setEventMetadata] = useState<EventMetadata | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormAndResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch event metadata to get formId
        const eventMetadataDoc = await getDoc(doc(db, "EventsMetadata", eventId));
        if (!eventMetadataDoc.exists()) {
          setError("Event metadata not found");
          setLoading(false);
          return;
        }
        const eventMetadataData = eventMetadataDoc.data() as EventMetadata;
        setEventMetadata(eventMetadataData);

        const formId = eventMetadataData.formId;
        if (!formId) {
          setError("No formId found in event metadata");
          setLoading(false);
          return;
        }

        // Fetch form document
        const formDoc = await getDoc(doc(db, "Forms", formId));
        if (!formDoc.exists()) {
          setError("Form not found");
          setLoading(false);
          return;
        }
        const formData = formDoc.data() as Form;
        setForm(formData);

        // Fetch form responses
        const responsesSnapshot = await getDocs(
          query(
            collection(db, "FormResponses", "Submitted"),
            where("formId", "==", formId),
            where("eventId", "==", eventId)
          )
        );

        // Convert each response's responseMap (object) to Map<string, FormSection>
        const responses: FormResponse[] = responsesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const responseMapObj = data.responseMap || {};
          const responseMap = new Map<string, FormSection>(Object.entries(responseMapObj));

          return {
            ...data,
            responseMap,
          } as FormResponse;
        });

        setFormResponses(responses);
      } catch (err) {
        console.error("Failed to load form data:", err);
        setError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchFormAndResponses();
  }, [eventId]);

  if (loading) return <div>Loading form responses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!form || !eventMetadata) return <div>No form or event metadata found</div>;

  // Collect all unique section IDs from form + responses
  const uniqueSectionIds = new Set<string>(form.sectionsOrder);
  for (const response of formResponses) {
    for (const sectionId of response.responseMap.keys()) {
      uniqueSectionIds.add(sectionId);
    }
  }

  // Order: original form order + any new sections found in responses
  const allSectionIds = [
    ...form.sectionsOrder,
    ...[...uniqueSectionIds].filter((id) => !form.sectionsOrder.includes(id)),
  ];

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Form Responses</div>
      </div>

      <div className="flex flex-col overflow-x-auto">
        {/* Header Row */}
        <div className="min-w-max grid auto-cols-max grid-flow-col justify-start text-organiser-title-gray-text font-bold text-xs md:text-base">
          {allSectionIds.map((sectionId) => {
            const section = form.sectionsMap.get(sectionId);
            return (
              <div key={sectionId} className="px-4 py-2 whitespace-nowrap border-b border-gray-300">
                {section?.question || `Untitled (${sectionId})`}
              </div>
            );
          })}
          <div className="px-1.5 flex items-center">
            <EllipsisVerticalIcon className="w-6 stroke-0" />
          </div>
        </div>

        <div className="inline-block w-full h-0.5 my-0 md:my-2 self-stretch bg-organiser-title-gray-text"></div>

        {/* Response Rows */}
        {formResponses.map((response, idx) => (
          <div
            key={`response-${idx}`}
            className="min-w-max grid auto-cols-max grid-flow-col justify-start text-xs md:text-base"
          >
            {allSectionIds.map((sectionId) => {
              const section = response.responseMap.get(sectionId);
              return (
                <div key={`${idx}-${sectionId}`} className="px-4 py-2 whitespace-nowrap border-b border-gray-300">
                  {getAnswerDisplay(section)}
                </div>
              );
            })}
            <div className="px-1.5 flex items-center">
              <EllipsisVerticalIcon className="w-6 stroke-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDrilldownFormsPage;
