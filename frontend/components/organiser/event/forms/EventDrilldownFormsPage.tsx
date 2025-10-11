import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EventData } from "@/interfaces/EventTypes";
import { FormId, FormResponse, FormSection, FormSectionType, FormTitle, SectionId } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
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

const formatTimestamp = (ts: Timestamp | null): string => {
  if (!ts) return "—";
  const date = ts.toDate();
  return date.toLocaleString();
};

const EventDrilldownFormsPage = ({ eventId }: EventDrilldownFormsPageProps) => {
  const logger = new Logger("EventDrilldownFormsPageLogger");
  const { user } = useUser();
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [formId, setFormId] = useState<FormId | null>(null);
  const [formTitle, setFormTitle] = useState<FormTitle | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowIndex)) {
      newExpandedRows.delete(rowIndex);
    } else {
      newExpandedRows.add(rowIndex);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleFormAttachment = async (selectedFormId: FormId | null) => {
    if (!selectedFormId) {
      setFormId(null);
      setFormTitle(null);
      return;
    }

    try {
      setAttachingForm(true);
      setError(null);

      // Update the event with the selected formId
      await updateEventById(eventId, { formId: selectedFormId });

      // Update local state and refetch responses
      setFormId(selectedFormId);

      // Fetch form details to get the title
      const form = await getForm(selectedFormId);
      setFormTitle(form.title);

      // Fetch responses for the newly attached form
      const formResponse = await getFormResponsesForEvent(selectedFormId, eventId);
      setFormResponses(formResponse);
    } catch (err) {
      logger.error(`Failed to attach form to event: ${err}`);
      setError("Failed to attach form to event");
    } finally {
      setAttachingForm(false);
    }
  };

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        let formId: FormId | null = null;

        const eventData: EventData = await getEventById(eventId);
        if (eventData.formId) {
          formId = eventData.formId as FormId;
          setFormId(eventData.formId);
          setLoading(false);
        }

        if (!formId) {
          // No formId found - this is okay, we'll show the FormSelector
          setFormId(null);
          setFormTitle(null);
          setLoading(false);
          return;
        }

        // Fetch form details to get the title
        const form = await getForm(formId);
        setFormTitle(form.title);

        const formResponse = await getFormResponsesForEvent(formId as FormId, eventId);
        setFormResponses(formResponse);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [eventId]);

  if (loading) return <div>Loading form responses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  // If no form is attached to the event, show the FormSelector
  if (!formId) {
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        <h1 className="text-2xl font-extrabold mb-6">Form Responses</h1>
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">
            No registration form is currently attached to this event. Select a form below to start collecting
            participant registrations.
          </p>
        </div>
        {attachingForm ? (
          <div className="text-sm text-gray-600">Attaching form to event...</div>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
      </div>
    );
  }

  if (formResponses.length === 0)
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        <h1 className="text-2xl font-extrabold mb-2">Form Responses</h1>
        {formTitle && <p className="text-sm text-gray-400 mb-6 line-clamp-1">Form: {formTitle}</p>}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">No responses submitted</p>
        </div>
      </div>
    );

  // Collect all unique question identifiers across all responses
  const allQuestionIdentifiers = new Set<string>();

  // First pass: collect all possible question identifiers (including duplicates within responses)
  formResponses.forEach((response) => {
    const questionCounts = new Map<string, number>();

    Object.entries(response.responseMap).forEach(([_, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);

        const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
        allQuestionIdentifiers.add(uniqueIdentifier);
      }
    });
  });

  const sortedQuestions = Array.from(allQuestionIdentifiers).sort((a, b) => a.localeCompare(b));

  // Helper function to create question identifier to section mapping for each response
  const createQuestionMappingForResponse = (responseMap: Record<SectionId, FormSection>): Map<string, FormSection> => {
    const questionCounts = new Map<string, number>();
    const questionMapping = new Map<string, FormSection>();

    Object.entries(responseMap).forEach(([_, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);

        const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
        questionMapping.set(uniqueIdentifier, section);
      }
    });

    return questionMapping;
  };

  // Calculate minimum table width: 30px (index) + 150px per question + 400px (submission time) + 30px (expand button)
  const minTableWidth = 30 + sortedQuestions.length * 150 + 400 + 30;

  const csvHeaders = [
    { label: "#", key: "index" },
    ...sortedQuestions.map((question) => ({ label: question, key: question })),
    { label: "Submission Time", key: "submissionTime" },
  ];

  const csvData = formResponses.map((response, idx) => {
    const row: Record<string, string> = { index: (idx + 1).toString() };
    const questionMapping = createQuestionMappingForResponse(response.responseMap);

    // For each sorted question identifier, get the corresponding answer
    sortedQuestions.forEach((questionId) => {
      const section = questionMapping.get(questionId);
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

      row[questionId] = answer;
    });

    row.submissionTime = formatTimestamp(response.submissionTime);

    return row;
  });

  return (
    <div className="w-full md:w-[calc(100%-18rem)] my-2">
      <div className="flex items-center justify-between mb-4 px-1 md:px-0">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Form Responses</h1>
          {formTitle && <p className="text-sm text-gray-400 line-clamp-1">Form: {formTitle}</p>}
        </div>
        <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
      </div>

      {/* Table with fixed layout and scroll support */}
      <div className="border border-core-outline rounded-lg max-h-[600px] overflow-x-auto overflow-y-auto w-full">
        <div className="table table-auto text-left w-full" style={{ minWidth: `${minTableWidth}px` }}>
          {/* Header */}
          <div className="table-header-group text-organiser-title-gray-text font-bold text-sm bg-core-hover border-b border-core-outline sticky top-0 z-20">
            <div className="table-row">
              <div className="table-cell px-3 py-2 border-r border-core-outline w-[30px]">#</div>
              {sortedQuestions.map((question, i) => (
                <div
                  key={`header-${i}`}
                  className={`table-cell px-3 py-2 min-w-[100px] md:min-w-[150px] max-w-[300px] border-r border-core-outline ${
                    headersExpanded
                      ? "break-words whitespace-pre-wrap"
                      : "whitespace-nowrap overflow-hidden text-ellipsis"
                  }`}
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
              const questionMapping = createQuestionMappingForResponse(response.responseMap);

              return (
                <div key={`response-${idx}`} className={`table-row ${rowClasses}`}>
                  <div className="table-cell px-3 py-2 align-top border-r border-core-outline w-[30px]">
                    <Link
                      className="underline text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                    >
                      {idx + 1}
                    </Link>
                  </div>
                  {sortedQuestions.map((questionId, j) => {
                    const section = questionMapping.get(questionId);
                    const isRowExpanded = expandedRows.has(idx);
                    return (
                      <div
                        key={`cell-${idx}-${j}`}
                        className={`table-cell px-3 py-2 min-w-[100px] md:min-w-[150px] max-w-[300px] border-r border-core-outline ${
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
                    <Link
                      className="underline text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                    >
                      {formatTimestamp(response.submissionTime)}
                    </Link>
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
