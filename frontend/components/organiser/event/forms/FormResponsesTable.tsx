import { EventId, EventMetadata } from "@/interfaces/EventTypes";
import { FormId, FormResponse, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import React, { useState } from "react";

interface PurchaserInfo {
  name: string;
  email: string;
}

interface FormResponsesTableProps {
  formResponses: FormResponse[];
  formId: FormId;
  eventId: EventId;
  eventMetadata: EventMetadata;
  showPurchaserColumn?: boolean;
}

const getAnswerDisplay = (section: FormSection | undefined): string | React.JSX.Element => {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
    case FormSectionType.DROPDOWN_SELECT:
    case FormSectionType.MULTIPLE_CHOICE:
      return section.answer || "—";
    case FormSectionType.TICKBOX:
      return section.answer?.join(", ") || "—";
    case FormSectionType.DATE_TIME:
      if (!section.timestamp) return "—";
      try {
        return new Date(section.timestamp).toLocaleString();
      } catch {
        return section.timestamp;
      }
    case FormSectionType.FILE_UPLOAD:
      if (!section.fileUrl) return "—";
      return (
        <a
          href={section.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-800 underline hover:text-blue-900"
        >
          View File
        </a>
      );
    default:
      return "—";
  }
};

const formatTimestamp = (ts: Timestamp | null): string => {
  if (!ts) return "—";
  const date = ts.toDate();
  return date.toLocaleString();
};

const createFormResponseToPurchaserMap = (eventMetadata: EventMetadata): Map<string, PurchaserInfo> => {
  const formResponseToPurchaser = new Map<string, PurchaserInfo>();

  if (!eventMetadata.purchaserMap) return formResponseToPurchaser;

  Object.values(eventMetadata.purchaserMap).forEach((purchaser) => {
    const email = purchaser.email || "";
    if (purchaser.attendees) {
      Object.entries(purchaser.attendees).forEach(([name, attendeeData]) => {
        const formResponseIds = attendeeData.formResponseIds || [];
        formResponseIds.forEach((formResponseId: string) => {
          formResponseToPurchaser.set(formResponseId, { name, email });
        });
      });
    }
  });

  return formResponseToPurchaser;
};

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

export const FormResponsesTable = ({
  formResponses,
  formId,
  eventId,
  eventMetadata,
  showPurchaserColumn = true,
}: FormResponsesTableProps) => {
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

  // Create mapping from form response ID to purchaser info
  const formResponseToPurchaser = createFormResponseToPurchaserMap(eventMetadata);

  // Sort form responses by purchaser (email, then name) if showing purchaser column
  const sortedFormResponses = showPurchaserColumn
    ? [...formResponses].sort((a, b) => {
        const purchaserA = formResponseToPurchaser.get(a.formResponseId);
        const purchaserB = formResponseToPurchaser.get(b.formResponseId);

        if (!purchaserA && !purchaserB) return 0;
        if (!purchaserA) return 1;
        if (!purchaserB) return -1;

        // Sort by email first, then by name
        const emailCompare = purchaserA.email.localeCompare(purchaserB.email);
        if (emailCompare !== 0) return emailCompare;

        return purchaserA.name.localeCompare(purchaserB.name);
      })
    : formResponses;

  // Collect all unique question identifiers across all responses
  const allQuestionIdentifiers = new Set<string>();

  sortedFormResponses.forEach((response) => {
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

  // Calculate minimum table width
  const purchaserColumnWidth = showPurchaserColumn ? 300 : 0;
  const minTableWidth = 30 + purchaserColumnWidth + sortedQuestions.length * 150 + 400 + 30;

  if (sortedFormResponses.length === 0) {
    return (
      <div className="border border-core-outline rounded-lg p-6 text-center">
        <p className="text-gray-600">No form responses found</p>
      </div>
    );
  }

  return (
    <div className="border border-core-outline rounded-lg max-h-[600px] overflow-x-auto overflow-y-auto w-full">
      <table className="table-auto text-left w-full" style={{ minWidth: `${minTableWidth}px` }}>
        {/* Header */}
        <thead className="text-organiser-title-gray-text font-bold text-sm bg-core-hover border-b border-core-outline sticky top-0 z-20">
          <tr>
            <th className="px-3 py-2 border-r border-core-outline w-[30px]">#</th>
            {showPurchaserColumn && (
              <th className="px-3 py-2 border-r border-core-outline w-[300px]">Purchaser Details</th>
            )}
            {sortedQuestions.map((question, i) => (
              <th
                key={`header-${i}`}
                className={`px-3 py-2 min-w-[100px] md:min-w-[150px] max-w-[300px] border-r border-core-outline ${
                  headersExpanded
                    ? "break-words whitespace-pre-wrap"
                    : "whitespace-nowrap overflow-hidden text-ellipsis"
                }`}
              >
                {question}
              </th>
            ))}
            <th className="px-3 py-2 border-r border-core-outline w-[400px]">Submission Time</th>
            <th className="px-2 align-middle w-[30px] sticky right-0 bg-core-hover z-10">
              <button
                onClick={() => setHeadersExpanded(!headersExpanded)}
                className="flex items-center justify-center w-6 h-6 hover:bg-gray-200 rounded transition-colors"
              >
                {headersExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="text-sm">
          {sortedFormResponses.map((response, idx) => {
            const isLast = idx === sortedFormResponses.length - 1;
            const rowClasses = isLast ? "" : "border-b border-blue-gray-50";
            const questionMapping = createQuestionMappingForResponse(response.responseMap);

            const currentPurchaser = formResponseToPurchaser.get(response.formResponseId);
            const prevPurchaser =
              idx > 0 ? formResponseToPurchaser.get(sortedFormResponses[idx - 1].formResponseId) : null;

            // Determine if we should show purchaser details (first row or different purchaser from previous)
            const showPurchaserDetails =
              showPurchaserColumn &&
              (idx === 0 ||
                !prevPurchaser ||
                !currentPurchaser ||
                prevPurchaser.email !== currentPurchaser.email ||
                prevPurchaser.name !== currentPurchaser.name);

            // Calculate rowspan for merged cells
            let rowspan = 1;
            if (showPurchaserDetails && currentPurchaser) {
              for (let i = idx + 1; i < sortedFormResponses.length; i++) {
                const nextPurchaser = formResponseToPurchaser.get(sortedFormResponses[i].formResponseId);
                if (
                  nextPurchaser &&
                  nextPurchaser.email === currentPurchaser.email &&
                  nextPurchaser.name === currentPurchaser.name
                ) {
                  rowspan++;
                } else {
                  break;
                }
              }
            }

            return (
              <tr key={`response-${idx}`} className={rowClasses}>
                <td className="px-3 py-2 align-top border-r border-core-outline w-[30px]">
                  <Link
                    className="underline text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                  >
                    {idx + 1}
                  </Link>
                </td>
                {showPurchaserDetails && (
                  <td rowSpan={rowspan} className="px-3 py-2 w-[300px] align-top border-r border-core-outline">
                    {currentPurchaser ? (
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-sm">{currentPurchaser.name}</div>
                        <div className="text-xs text-gray-600 break-words">{currentPurchaser.email}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </td>
                )}
                {sortedQuestions.map((questionId, j) => {
                  const section = questionMapping.get(questionId);
                  const isRowExpanded = expandedRows.has(idx);
                  return (
                    <td
                      key={`cell-${idx}-${j}`}
                      className={`px-3 py-2 min-w-[100px] md:min-w-[150px] max-w-[300px] border-r border-core-outline ${
                        isRowExpanded
                          ? "break-words whitespace-pre-wrap"
                          : "whitespace-nowrap overflow-x-hidden text-ellipsis"
                      }`}
                    >
                      {getAnswerDisplay(section)}
                    </td>
                  );
                })}
                <td className="px-3 py-2 w-[400px] whitespace-nowrap align-top border-r border-core-outline">
                  <Link
                    className="underline text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                  >
                    {formatTimestamp(response.submissionTime)}
                  </Link>
                </td>
                <td className="px-3 py-2 w-[30px] align-top sticky right-0 bg-white border-l border-core-outline">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
