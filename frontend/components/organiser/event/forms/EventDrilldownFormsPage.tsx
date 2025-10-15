import DownloadCsvButton from "@/components/DownloadCsvButton";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EventData } from "@/interfaces/EventTypes";
import {
  FormId,
  FormResponse,
  FormResponseId,
  FormSection,
  FormSectionType,
  FormTitle,
  SectionId,
} from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import { deleteFormResponse, getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { ChevronDownIcon, ChevronUpIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

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
  const router = useRouter();
  const { user } = useUser();
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [formId, setFormId] = useState<FormId | null>(null);
  const [formTitle, setFormTitle] = useState<FormTitle | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<FormResponseId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowIndex)) {
      newExpandedRows.delete(rowIndex);
    } else {
      newExpandedRows.add(rowIndex);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleDeleteResponse = async (responseId: FormResponseId) => {
    if (!formId) return;

    if (!confirm("Are you sure you want to delete this form response? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteFormResponse(formId, eventId, responseId);
      setFormResponses((prev) => prev.filter((r) => r.formResponseId !== responseId));
      setOpenMenuId(null);
    } catch (err) {
      logger.error(`Failed to delete form response: ${err}`);
      setError("Failed to delete form response");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFormAttachment = async (selectedFormId: FormId | null) => {
    try {
      setAttachingForm(true);
      setError(null);

      // Update the event with the selected formId (or null to detach)
      await updateEventById(eventId, { formId: selectedFormId });

      if (!selectedFormId) {
        // Detach form: clear local state
        setFormId(null);
        setFormTitle(null);
        setFormResponses([]);
        return;
      }

      // Attach form: update local state and fetch responses
      setFormId(selectedFormId);

      // Fetch form details to get the title
      const form = await getForm(selectedFormId);
      setFormTitle(form.title);

      // Fetch responses for the newly attached form
      const formResponse = await getFormResponsesForEvent(selectedFormId, eventId);
      setFormResponses(formResponse);
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
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
        {attachingForm ? (
          <div className="text-sm text-gray-600">Attaching form to event...</div>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
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

  // Calculate minimum table width: 30px (index) + 150px per question + 400px (submission time) + 60px (expand/menu buttons)
  const minTableWidth = 30 + sortedQuestions.length * 150 + 400 + 60;

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
        <div className="flex gap-2">
          <InvertedHighlightButton
            onClick={() => router.push(`/organiser/forms/${formId}/${eventId}/manual-submit`)}
            className="border-1 px-3 bg-white"
          >
            <span className="text-sm">+ Add Response</span>
          </InvertedHighlightButton>
          <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
        </div>
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
              <div className="table-cell px-2 align-middle w-[60px] sticky right-0 bg-core-hover z-10">
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
                  <div className="table-cell px-2 py-2 w-[60px] align-top sticky right-0 bg-white border-l border-core-outline">
                    <div className="flex gap-1 items-center">
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
                      <div className="relative" ref={openMenuId === response.formResponseId ? menuRef : null}>
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === response.formResponseId ? null : response.formResponseId)
                          }
                          className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                        {openMenuId === response.formResponseId && (
                          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                            <button
                              onClick={() => handleDeleteResponse(response.formResponseId)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
