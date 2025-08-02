import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { db } from "@/services/src/firebase";
import { getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { doc, getDoc, Timestamp } from "firebase/firestore";
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
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowIndex)) {
      newExpandedRows.delete(rowIndex);
    } else {
      newExpandedRows.add(rowIndex);
    }
    setExpandedRows(newExpandedRows);
  };

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

        const formResponse = await getFormResponsesForEvent(formId as FormId, eventId);
        setFormResponses(formResponse);
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
    Object.values(response.responseMap).forEach((section) => {
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
      const section = Object.values(response.responseMap).find((s) => s?.question?.trim() === question);
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
    <div className="md:w-[calc(100%-18rem)] my-2">
      <div className="flex items-center justify-between mb-4 px-1 md:px-0">
        <h1 className="text-2xl font-extrabold">Form Responses</h1>
        <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
      </div>

      {/* Table with fixed layout and scroll support */}
      <div className="border border-core-outline rounded-lg max-h-[600px] overflow-scroll">
        <div className="table table-auto text-left">
          {/* Header */}
          <div className="table-header-group text-organiser-title-gray-text font-bold text-sm bg-core-hover border-b border-core-outline sticky top-0 z-20">
            <div className="table-row">
              <div className="table-cell px-3 py-2 border-r border-core-outline w-[30px]">#</div>
              {sortedQuestions.map((question, i) => (
                <div
                  key={`header-${i}`}
                  className={`table-cell px-3 py-2 max-w-[200px] min-w-[100px] md:min-w-[0px] border-r border-core-outline ${
                    headersExpanded
                      ? "break-words whitespace-pre-wrap"
                      : "whitespace-nowrap overflow-hidden text-ellipsis"
                  }`}
                  title={!headersExpanded ? question : undefined}
                >
                  {question}
                </div>
              ))}
              <div className="table-cell px-3 py-2 border-r border-core-outline w-[400px]">Submission Time</div>
              <div className="table-cell px-2 align-middle w-[30px] sticky right-0 bg-core-hover z-10">
                <button
                  onClick={() => setHeadersExpanded(!headersExpanded)}
                  className="flex items-center justify-center w-6 h-6 hover:bg-gray-200 rounded transition-colors"
                >
                  {headersExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="table-row-group text-sm">
            {formResponses.map((response, idx) => {
              const isLast = idx === formResponses.length - 1;
              const rowClasses = isLast ? "" : "border-b border-blue-gray-50";

              return (
                <div key={`response-${idx}`} className={`table-row ${rowClasses}`}>
                  <div className="table-cell px-3 py-2 align-top border-r border-core-outline w-[30px]">{idx + 1}</div>
                  {sortedQuestions.map((question, j) => {
                    const section = Object.values(response.responseMap).find((s) => s?.question?.trim() === question);
                    const isRowExpanded = expandedRows.has(idx);
                    return (
                      <div
                        key={`cell-${idx}-${j}`}
                        className={`table-cell px-3 py-2 max-w-[200px] min-w-[100px] md:min-w-[0px] border-r border-core-outline ${
                          isRowExpanded
                            ? "break-words whitespace-pre-wrap"
                            : "whitespace-nowrap overflow-x-hidden text-ellipsis"
                        }`}
                      >
                        {getAnswerDisplay(section)}
                      </div>
                    );
                  })}
                  <div className="table-cell px-3 py-2 w-[400px] whitespace-nowrap align-top border-r border-core-outline">
                    {formatTimestamp(response.submissionTime)}
                  </div>
                  <div className="table-cell px-3 py-2 w-[30px] align-top sticky right-0 bg-white border-l border-core-outline">
                    <button
                      onClick={() => toggleRowExpansion(idx)}
                      className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded transition-colors"
                    >
                      {expandedRows.has(idx) ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownFormsPage;
