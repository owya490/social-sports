import { FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { db } from "@/services/src/firebase";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";

interface EventDrilldownFormsPageProps {
  eventId: string;
}

const getAnswerDisplay = (section: FormSection | undefined): string | React.JSX.Element => {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
    case FormSectionType.DROPDOWN_SELECT:
      return section.answer || "—";
    default:
      return "—";
  }
};

const EventDrilldownFormsPage = ({ eventId }: EventDrilldownFormsPageProps) => {
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        const statuses = ["Active", "InActive"];
        const visibilities = ["Public", "Private"];

        let formId: string | null = null;

        // Find formId from event
        for (const status of statuses) {
          for (const visibility of visibilities) {
            const eventDocRef = doc(db, "Events", status, visibility, eventId);
            const eventDocSnap = await getDoc(eventDocRef);
            if (eventDocSnap.exists()) {
              const data = eventDocSnap.data();
              if (data?.formId) {
                formId = data.formId;
                break;
              }
            }
          }
          if (formId) break;
        }

        if (!formId) {
          setError("No formId found for this event");
          setLoading(false);
          return;
        }

        // Fetch form responses from subcollection
        const responseCollectionRef = collection(db, "Forms", "FormResponses", "Submitted", formId, eventId);
        const responsesSnapshot = await getDocs(responseCollectionRef);

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
        console.error("Failed to load form responses:", err);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [eventId]);

  if (loading) return <div>Loading form responses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (formResponses.length === 0) return <div>No responses submitted</div>;

  // Dynamically build section order based on questions found across all responses
  const allSectionIds = Array.from(
    new Set(formResponses.flatMap((response) => Array.from(response.responseMap.keys())))
  );

  const sectionIdToQuestion = new Map<string, string>();
  formResponses.forEach((response) => {
    for (const [sectionId, section] of response.responseMap.entries()) {
      if (section?.question && !sectionIdToQuestion.has(sectionId)) {
        sectionIdToQuestion.set(sectionId, section.question);
      }
    }
  });

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Form Responses</div>
      </div>

      <div className="flex flex-col overflow-x-auto">
        {/* Header Row */}
        <div className="min-w-max grid auto-cols-max grid-flow-col justify-start text-organiser-title-gray-text font-bold text-xs md:text-base">
          {allSectionIds.map((sectionId) => (
            <div key={sectionId} className="px-4 py-2 whitespace-nowrap border-b border-gray-300">
              {sectionIdToQuestion.get(sectionId) || `Untitled (${sectionId})`}
            </div>
          ))}
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
