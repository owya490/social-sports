"use client";

import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import React, { Fragment, useMemo, useState } from "react";

interface PurchaserInfo {
  name: string;
  email: string;
}

interface FormResponsesTableProps {
  formResponses: FormResponse[];
  formId: FormId;
  form: Form;
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
  showPurchaserColumn?: boolean;
  /** Flush workbench shell — no bordered card frame; Honest Clubhouse tokens */
  flush?: boolean;
}

type SortDirection = "asc" | "desc";

type SortColumn = { kind: "purchaser" } | { kind: "submissionTime" } | { kind: "question"; questionId: string };

const getAnswerDisplay = (
  section: FormSection | undefined,
  flush: boolean,
): string | React.JSX.Element => {
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
          className={
            flush
              ? "text-foreground underline underline-offset-2 hover:text-foreground-secondary font-sans"
              : "text-blue-800 underline hover:text-blue-900"
          }
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

const createFormResponseMap = (orderTicketsMap: Map<Order, Ticket[]>): Map<string, PurchaserInfo> => {
  const formResponseToPurchaser = new Map<string, PurchaserInfo>();

  orderTicketsMap.forEach((tickets, order) => {
    tickets.forEach((ticket) => {
      if (ticket.formResponseId) {
        formResponseToPurchaser.set(ticket.formResponseId, {
          name: order.fullName,
          email: order.email,
        });
      }
    });
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

const getSectionSortString = (section: FormSection | undefined): string => {
  if (!section) return "";
  switch (section.type) {
    case FormSectionType.TEXT:
    case FormSectionType.DROPDOWN_SELECT:
    case FormSectionType.MULTIPLE_CHOICE:
      return (section.answer ?? "").trim();
    case FormSectionType.TICKBOX:
      return (section.answer ?? []).join(", ");
    case FormSectionType.DATE_TIME:
      return section.timestamp ?? "";
    case FormSectionType.FILE_UPLOAD:
      return section.fileUrl ?? "";
    default:
      return "";
  }
};

const comparePurchaser = (
  a: FormResponse,
  b: FormResponse,
  formResponseToPurchaser: Map<string, PurchaserInfo>,
): number => {
  const purchaserA = formResponseToPurchaser.get(a.formResponseId);
  const purchaserB = formResponseToPurchaser.get(b.formResponseId);

  if (!purchaserA && !purchaserB) return 0;
  if (!purchaserA) return 1;
  if (!purchaserB) return -1;

  const emailCompare = purchaserA.email.localeCompare(purchaserB.email, undefined, { sensitivity: "base" });
  if (emailCompare !== 0) return emailCompare;

  return purchaserA.name.localeCompare(purchaserB.name, undefined, { sensitivity: "base" });
};

const compareSubmissionTime = (a: FormResponse, b: FormResponse): number => {
  const ma = a.submissionTime?.toMillis() ?? null;
  const mb = b.submissionTime?.toMillis() ?? null;
  if (ma === null && mb === null) return 0;
  if (ma === null) return 1;
  if (mb === null) return -1;
  return ma - mb;
};

const compareQuestion = (a: FormResponse, b: FormResponse, questionId: string): number => {
  const mapA = createQuestionMappingForResponse(a.responseMap);
  const mapB = createQuestionMappingForResponse(b.responseMap);
  const secA = mapA.get(questionId);
  const secB = mapB.get(questionId);

  if (secA?.type === FormSectionType.DATE_TIME && secB?.type === FormSectionType.DATE_TIME) {
    const ta = secA.timestamp ? Date.parse(secA.timestamp) : NaN;
    const tb = secB.timestamp ? Date.parse(secB.timestamp) : NaN;
    const validA = !Number.isNaN(ta);
    const validB = !Number.isNaN(tb);
    if (validA && validB) return ta - tb;
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    return -1;
  }

  return getSectionSortString(secA).localeCompare(getSectionSortString(secB), undefined, { sensitivity: "base" });
};

const sortColumnsEqual = (a: SortColumn, b: SortColumn): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === "question" && b.kind === "question") return a.questionId === b.questionId;
  return true;
};

interface SortableHeaderCellProps {
  label: React.ReactNode;
  column: SortColumn;
  activeColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn, direction: SortDirection) => void;
  headerTextClassName?: string;
  thClassName?: string;
  flush?: boolean;
}

const SortableHeaderCell = ({
  label,
  column,
  activeColumn,
  sortDirection,
  onSort,
  headerTextClassName,
  thClassName = "",
  flush = false,
}: SortableHeaderCellProps) => {
  const isActive = sortColumnsEqual(column, activeColumn);
  const borderClass = flush ? "border-r border-border" : "border-r border-core-outline";

  return (
    <th
      className={["group relative px-3 py-2 align-top", borderClass, thClassName].filter(Boolean).join(" ")}
    >
      <div className="flex items-start justify-between gap-2 min-h-[1.5rem]">
        <div className={headerTextClassName ?? "min-w-0 flex-1"}>{label}</div>
        <Menu as="div" className="relative shrink-0">
          <MenuButton
            type="button"
            className={
              flush
                ? "rounded-lg p-0.5 text-foreground-muted opacity-100 transition-opacity hover:bg-surface-hover hover:text-foreground md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-expanded:opacity-100"
                : "rounded p-0.5 text-gray-500 opacity-100 transition-opacity hover:bg-gray-200 hover:text-gray-800 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 aria-expanded:opacity-100"
            }
            aria-label="Column options"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems
              className={
                flush
                  ? "absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl border border-border bg-background py-1 shadow-[0_8px_28px_rgba(10,10,10,0.12)] focus:outline-none font-sans"
                  : "absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
              }
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                      flush
                        ? focus
                          ? "bg-surface-hover text-foreground"
                          : "text-foreground"
                        : focus
                          ? "bg-gray-100"
                          : ""
                    }`}
                    onClick={() => onSort(column, "asc")}
                  >
                    {isActive && sortDirection === "asc" ? "✓ " : ""}
                    Sort ascending
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                      flush
                        ? focus
                          ? "bg-surface-hover text-foreground"
                          : "text-foreground"
                        : focus
                          ? "bg-gray-100"
                          : ""
                    }`}
                    onClick={() => onSort(column, "desc")}
                  >
                    {isActive && sortDirection === "desc" ? "✓ " : ""}
                    Sort descending
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </th>
  );
};

export const FormResponsesTable = ({
  formResponses,
  formId,
  form,
  eventId,
  orderTicketsMap,
  showPurchaserColumn = true,
  flush = false,
}: FormResponsesTableProps) => {
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn>(() =>
    showPurchaserColumn ? { kind: "purchaser" } : { kind: "submissionTime" },
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const formResponseToPurchaser = useMemo(() => createFormResponseMap(orderTicketsMap), [orderTicketsMap]);

  const handleSort = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const allQuestionIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    formResponses.forEach((response) => {
      const questionCounts = new Map<string, number>();
      Object.entries(response.responseMap).forEach(([_, section]) => {
        if (section.type !== FormSectionType.IMAGE) {
          const question = section.question.trim();
          const count = questionCounts.get(question) || 0;
          questionCounts.set(question, count + 1);
          const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
          ids.add(uniqueIdentifier);
        }
      });
    });
    return ids;
  }, [formResponses]);

  const currentFormQuestionIdentifiers = useMemo(() => {
    const map = new Map<string, number>();
    const formQuestionCounts = new Map<string, number>();
    form.sectionsOrder.forEach((sectionId, orderIndex) => {
      const section = form.sectionsMap[sectionId];
      if (section && section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = formQuestionCounts.get(question) || 0;
        formQuestionCounts.set(question, count + 1);
        const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
        map.set(uniqueIdentifier, orderIndex);
      }
    });
    return map;
  }, [form]);

  const sortedQuestions = useMemo(() => {
    return Array.from(allQuestionIdentifiers).sort((a, b) => {
      const aInCurrentForm = currentFormQuestionIdentifiers.has(a);
      const bInCurrentForm = currentFormQuestionIdentifiers.has(b);

      if (aInCurrentForm && bInCurrentForm) {
        const aOrder = currentFormQuestionIdentifiers.get(a)!;
        const bOrder = currentFormQuestionIdentifiers.get(b)!;
        return aOrder - bOrder;
      }
      if (aInCurrentForm && !bInCurrentForm) return -1;
      if (!aInCurrentForm && bInCurrentForm) return 1;
      return a.localeCompare(b);
    });
  }, [allQuestionIdentifiers, currentFormQuestionIdentifiers]);

  const sortedFormResponses = useMemo(() => {
    const copy = [...formResponses];
    const dir = sortDirection === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn.kind) {
        case "purchaser":
          cmp = comparePurchaser(a, b, formResponseToPurchaser);
          break;
        case "submissionTime":
          cmp = compareSubmissionTime(a, b);
          break;
        case "question":
          cmp = compareQuestion(a, b, sortColumn.questionId);
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return String(a.formResponseId).localeCompare(String(b.formResponseId));
    });

    return copy;
  }, [formResponses, sortColumn, sortDirection, formResponseToPurchaser]);

  const toggleRowExpansion = (formResponseId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(formResponseId)) next.delete(formResponseId);
      else next.add(formResponseId);
      return next;
    });
  };

  const mergePurchaserCells = showPurchaserColumn && sortColumn.kind === "purchaser";

  const cellBorder = flush ? "border-r border-border" : "border-r border-core-outline";
  const rowBorder = flush ? "border-b border-border" : "border-b border-blue-gray-50";
  const linkClass = flush
    ? "underline underline-offset-2 text-foreground hover:text-foreground-secondary font-sans"
    : "underline text-blue-800";
  const headerBg = flush
    ? "bg-surface text-foreground font-semibold text-sm border-b border-border sticky top-0 z-20 font-sans"
    : "text-organiser-title-gray-text font-bold text-sm bg-core-hover border-b border-core-outline sticky top-0 z-20";
  const stickyHeaderBg = flush ? "bg-surface" : "bg-core-hover";
  const stickyCellBg = flush ? "bg-background" : "bg-white";
  const expandBtnClass = flush
    ? "flex items-center justify-center w-6 h-6 rounded-lg hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    : "flex items-center justify-center w-6 h-6 hover:bg-gray-200 rounded transition-colors";
  const rowExpandBtnClass = flush
    ? "flex items-center justify-center w-6 h-6 rounded-lg hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    : "flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded transition-colors";

  if (sortedFormResponses.length === 0) {
    return (
      <div
        className={
          flush
            ? "py-10 text-center text-sm text-foreground-muted font-sans"
            : "border border-core-outline rounded-lg p-6 text-center"
        }
      >
        <p className={flush ? undefined : "text-gray-600"}>No form responses found</p>
      </div>
    );
  }

  return (
    <div
      className={
        flush
          ? "max-h-[min(70vh,600px)] overflow-x-auto overflow-y-auto w-full border border-border rounded-xl"
          : "border border-core-outline rounded-lg max-h-[600px] overflow-x-auto overflow-y-auto w-full"
      }
    >
      <table className="table-auto text-left w-full">
        <thead className={headerBg}>
          <tr>
            <th className={`px-3 py-2 ${cellBorder} w-[30px]`}>#</th>
            {showPurchaserColumn && (
              <SortableHeaderCell
                label="Purchaser Details"
                column={{ kind: "purchaser" }}
                activeColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                thClassName="min-w-[350px]"
                flush={flush}
              />
            )}
            {sortedQuestions.map((question, i) => (
              <SortableHeaderCell
                key={`header-${i}`}
                label={
                  <span
                    className={
                      headersExpanded
                        ? `break-words whitespace-pre-wrap ${flush ? "font-semibold" : "font-bold"}`
                        : `block max-w-full truncate ${flush ? "font-semibold" : "font-bold"}`
                    }
                  >
                    {question}
                  </span>
                }
                column={{ kind: "question", questionId: question }}
                activeColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                thClassName="min-w-[100px] md:min-w-[150px] max-w-[300px]"
                headerTextClassName={
                  headersExpanded ? "min-w-0 flex-1 break-words whitespace-pre-wrap" : "min-w-0 flex-1 overflow-hidden"
                }
                flush={flush}
              />
            ))}
            <SortableHeaderCell
              label="Submission Time"
              column={{ kind: "submissionTime" }}
              activeColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              thClassName="w-[400px]"
              headerTextClassName="min-w-0 flex-1 whitespace-nowrap"
              flush={flush}
            />
            <th
              className={`px-2 align-middle w-[30px] ${
                flush ? "" : `sticky right-0 ${stickyHeaderBg} z-10`
              }`}
            >
              <button
                type="button"
                onClick={() => setHeadersExpanded(!headersExpanded)}
                className={expandBtnClass}
                aria-label={headersExpanded ? "Collapse column headers" : "Expand column headers"}
              >
                {headersExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
            </th>
          </tr>
        </thead>

        <tbody className={flush ? "text-sm text-foreground font-sans" : "text-sm"}>
          {sortedFormResponses.map((response, idx) => {
            const isLast = idx === sortedFormResponses.length - 1;
            const rowClasses = isLast ? "" : rowBorder;
            const questionMapping = createQuestionMappingForResponse(response.responseMap);
            const responseIdStr = String(response.formResponseId);

            const currentPurchaser = formResponseToPurchaser.get(response.formResponseId);
            const prevPurchaser =
              idx > 0 ? formResponseToPurchaser.get(sortedFormResponses[idx - 1].formResponseId) : null;

            let showPurchaserDetails: boolean;
            let rowspan = 1;

            if (!showPurchaserColumn) {
              showPurchaserDetails = false;
            } else if (mergePurchaserCells) {
              showPurchaserDetails =
                idx === 0 ||
                !prevPurchaser ||
                !currentPurchaser ||
                prevPurchaser.email !== currentPurchaser.email ||
                prevPurchaser.name !== currentPurchaser.name;

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
            } else {
              showPurchaserDetails = true;
              rowspan = 1;
            }

            return (
              <tr key={response.formResponseId} className={rowClasses}>
                <td className={`px-3 py-2 align-top ${cellBorder} w-[30px]`}>
                  <Link
                    className={linkClass}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                  >
                    {idx + 1}
                  </Link>
                </td>
                {showPurchaserDetails && (
                  <td
                    rowSpan={mergePurchaserCells && currentPurchaser ? rowspan : 1}
                    className={`px-3 py-2 min-w-[350px] align-top ${cellBorder}`}
                  >
                    {currentPurchaser ? (
                      <div className="flex flex-col gap-1">
                        <div className={flush ? "font-medium text-sm text-foreground" : "font-medium text-sm"}>
                          {currentPurchaser.name}
                        </div>
                        <div
                          className={
                            flush
                              ? "text-xs text-foreground-muted break-words"
                              : "text-xs text-gray-600 break-words"
                          }
                        >
                          {currentPurchaser.email}
                        </div>
                      </div>
                    ) : (
                      <div className={flush ? "text-xs text-foreground-muted" : "text-xs text-gray-600"}>
                        Form submission
                      </div>
                    )}
                  </td>
                )}
                {sortedQuestions.map((questionId, j) => {
                  const section = questionMapping.get(questionId);
                  const isRowExpanded = expandedRows.has(responseIdStr);
                  return (
                    <td
                      key={`cell-${response.formResponseId}-${j}`}
                      className={`px-3 py-2 min-w-[100px] md:min-w-[150px] max-w-[300px] ${cellBorder} ${
                        isRowExpanded
                          ? "break-words whitespace-pre-wrap"
                          : "whitespace-nowrap overflow-x-hidden text-ellipsis"
                      }`}
                    >
                      {getAnswerDisplay(section, flush)}
                    </td>
                  );
                })}
                <td className={`px-3 py-2 w-[400px] whitespace-nowrap align-top ${cellBorder}`}>
                  <Link
                    className={linkClass}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`/organiser/forms/${formId}/${eventId}/${response.formResponseId}`}
                  >
                    {formatTimestamp(response.submissionTime)}
                  </Link>
                </td>
                <td
                  className={`px-3 py-2 w-[30px] align-top ${
                    flush
                      ? "border-l border-border"
                      : `sticky right-0 ${stickyCellBg} border-l border-core-outline`
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRowExpansion(responseIdStr)}
                    className={rowExpandBtnClass}
                    aria-label={expandedRows.has(responseIdStr) ? "Collapse row" : "Expand row"}
                  >
                    {expandedRows.has(responseIdStr) ? (
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
