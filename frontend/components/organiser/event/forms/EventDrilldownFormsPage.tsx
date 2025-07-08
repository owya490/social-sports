import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { db } from "@/services/src/firebase";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
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

const formatTimestamp = (ts: Timestamp | undefined): string => {
  if (!ts) return "—";
  const date = ts.toDate();
  return date.toLocaleString();
};

const EventDrilldownFormsPage = ({ eventId }: EventDrilldownFormsPageProps) => {
  const [formResponses, setFormResponses] = useState<(FormResponse & { submissionTime?: Timestamp })[]>([]);
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

        const responseCollectionRef = collection(db, "Forms", "FormResponses", "Submitted", formId, eventId);
        const responsesSnapshot = await getDocs(responseCollectionRef);

        const responses: (FormResponse & { submissionTime?: Timestamp })[] = responsesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const responseMapObj = data.responseMap || {};
          const responseMap = new Map<string, FormSection>(Object.entries(responseMapObj));

          return {
            ...data,
            responseMap,
            submissionTime: data.submissionTime,
          } as FormResponse & { submissionTime?: Timestamp };
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

  // Collect unique questions across all responses
  const questionSet = new Set<string>();
  formResponses.forEach((response) => {
    response.responseMap.forEach((section) => {
      if (section?.question?.trim()) {
        questionSet.add(section.question.trim());
      }
    });
  });

  const sortedQuestions = Array.from(questionSet).sort((a, b) => a.localeCompare(b));

  const csvHeaders = [
    { label: "#", key: "index" },
    ...sortedQuestions.map((q) => ({ label: q, key: q })),
    { label: "Submission Time", key: "submissionTime" },
  ];

  const csvData = formResponses.map((response, idx) => {
    const row: Record<string, string> = { index: (idx + 1).toString() };

    sortedQuestions.forEach((question) => {
      const section = Array.from(response.responseMap.values()).find((s) => s?.question?.trim() === question);
      // Extract answer as string
      let answer = "—";
      if (section) {
        switch (section.type) {
          case FormSectionType.TEXT:
          case FormSectionType.DROPDOWN_SELECT:
            answer = section.answer || "—";
            break;
          default:
            answer = "—";
        }
      }
      row[question] = answer;
    });

    row.submissionTime = formatTimestamp(response.submissionTime);

    return row;
  });

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex items-center justify-between mb-4 mr-32">
        <h1 className="text-2xl md:text-4xl font-extrabold">Form Responses</h1>
        <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
      </div>

      {/* Horizontally scrollable wrapper */}
      <div className="w-full overflow-x-auto pr-8">
        <div className="inline-block align-middle mr-8">
          {/* Table with fixed layout and scroll support */}
          <div className="table w-full table-auto text-left">
            {/* Header */}
            <div className="table-header-group text-organiser-title-gray-text font-bold text-xs md:text-base border-b border-organiser-title-gray-text">
              <div className="table-row">
                <div className="table-cell min-w-[40px] px-3 py-2">#</div>
                {sortedQuestions.map((question, i) => (
                  <div
                    key={`header-${i}`}
                    className="table-cell px-3 py-2 min-w-[160px] break-words whitespace-pre-wrap"
                  >
                    {question}
                  </div>
                ))}
                <div className="table-cell min-w-[180px] px-3 py-2">Submission Time</div>
                <div className="table-cell min-w-[40px] px-3 py-2">
                  <EllipsisVerticalIcon className="w-6 stroke-0" />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="table-row-group text-sm md:text-base">
              {formResponses.map((response, idx) => (
                <div key={`response-${idx}`} className="table-row">
                  <div className="table-cell min-w-[40px] px-3 py-2 align-top">{idx + 1}</div>
                  {sortedQuestions.map((question, j) => {
                    const section = Array.from(response.responseMap.values()).find(
                      (s) => s?.question?.trim() === question
                    );
                    return (
                      <div
                        key={`cell-${idx}-${j}`}
                        className="table-cell px-3 py-2 min-w-[160px] break-words whitespace-pre-wrap align-top"
                      >
                        {getAnswerDisplay(section)}
                      </div>
                    );
                  })}
                  <div className="table-cell min-w-[180px] px-3 py-2 whitespace-nowrap align-top">
                    {formatTimestamp(response.submissionTime)}
                  </div>
                  <div className="table-cell min-w-[40px] px-3 py-2 align-top">
                    <EllipsisVerticalIcon className="w-5 stroke-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownFormsPage;
