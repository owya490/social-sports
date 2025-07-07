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

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300">
          <thead className="bg-gray-100 text-xs md:text-base text-left">
            <tr>
              {allSectionIds.map((sectionId) => (
                <th key={sectionId} className="px-4 py-2 border-b border-gray-300">
                  {sectionIdToQuestion.get(sectionId) || `Untitled (${sectionId})`}
                </th>
              ))}
              <th className="px-2 w-10">
                <EllipsisVerticalIcon className="w-5 stroke-0" />
              </th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-base">
            {formResponses.map((response, idx) => (
              <tr key={`response-${idx}`} className="even:bg-gray-50">
                {allSectionIds.map((sectionId) => {
                  const section = response.responseMap.get(sectionId);
                  return (
                    <td key={`${idx}-${sectionId}`} className="px-4 py-2 border-b border-gray-300 whitespace-nowrap">
                      {getAnswerDisplay(section)}
                    </td>
                  );
                })}
                <td className="px-2 text-center">
                  <EllipsisVerticalIcon className="w-5 stroke-0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventDrilldownFormsPage;
