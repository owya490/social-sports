"use client";

import {
  RecurringHoverBody,
  RecurringHoverFlags,
} from "@/components/organiser/v2/recurring/RecurringHoverBody";
import {
  EntityHoverCover,
  EntityHoverPreview,
} from "@/components/organiser/v2/shared/EntityHoverPreview";
import { EntityRowThumbnail } from "@/components/organiser/v2/shared/EntityRowThumbnail";
import { Frequency, RecurrenceTemplate, isRecurrenceTemplateV2 } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { calculateRecurrenceEnded } from "@/services/src/recurringEvents/recurringEventsService";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import { ArrowPathIcon, CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case Frequency.WEEKLY:
      return "Weekly";
    case Frequency.FORTNIGHTLY:
      return "Fortnightly";
    case Frequency.MONTHLY:
      return "Monthly";
    default:
      return frequency;
  }
}

function statusMeta(template: RecurrenceTemplate): {
  label: string;
  dotClass: string;
  ariaLabel: string;
} {
  const ended = calculateRecurrenceEnded(template);
  if (ended) {
    return {
      label: "Ended",
      dotClass: "bg-surface-muted border border-border",
      ariaLabel: "Recurrence ended",
    };
  }
  if (template.recurrenceData.recurrenceEnabled) {
    return {
      label: "Active",
      dotClass: "bg-foreground",
      ariaLabel: "Recurrence enabled",
    };
  }
  return {
    label: "Paused",
    dotClass: "bg-foreground-secondary",
    ariaLabel: "Recurrence paused",
  };
}

type RecurringTemplateRowProps = {
  template: RecurrenceTemplate;
};

export function RecurringTemplateRow({ template }: RecurringTemplateRowProps) {
  const { eventData, recurrenceData, recurrenceTemplateId } = template;
  const thumbnailSrc = eventData.thumbnail || eventData.image;
  const status = statusMeta(template);
  const scheduleLine = isRecurrenceTemplateV2(template)
    ? `${(recurrenceData.occurrences ?? []).length} ${
        (recurrenceData.occurrences ?? []).length === 1 ? "date" : "dates"
      }`
    : `${frequencyLabel(recurrenceData.frequency ?? Frequency.WEEKLY)} · ${
        recurrenceData.recurrenceAmount ?? 0
      } times · creates ${recurrenceData.createDaysBefore ?? 0}d before`;

  return (
    <EntityHoverPreview
      cover={<EntityHoverCover src={eventData.image || eventData.thumbnail} />}
      title={eventData.name}
      body={<RecurringHoverBody template={template} />}
      flags={<RecurringHoverFlags template={template} />}
    >
      <Link
        href={`/organiser/v2/event/recurring-events/${recurrenceTemplateId}`}
        className="group flex w-full items-center gap-3 p-2.5 sm:p-3 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
      >
        <EntityRowThumbnail
          src={thumbnailSrc}
          className="aspect-square size-[4.25rem] sm:size-[4.75rem] self-center"
        />

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">
              {eventData.name}
            </p>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-medium text-foreground-muted font-sans tabular-nums whitespace-nowrap">
                {getEventPriceDisplay(eventData.price, true)}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.dotClass}`}
                aria-label={status.ariaLabel}
                title={status.label}
              />
            </div>
          </div>

          <p className="text-xs text-foreground-muted font-sans truncate mt-1 flex items-center gap-1">
            <CalendarDaysIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
            Next: {timestampToEventCardDateString(eventData.startDate)}
          </p>
          <p className="text-xs text-foreground-muted font-sans truncate mt-0.5 flex items-center gap-1">
            <MapPinIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
            {eventData.location}
          </p>
          <p className="text-xs text-foreground-muted font-sans truncate mt-1.5 flex items-center gap-1">
            <ArrowPathIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {status.label} · {scheduleLine}
            </span>
          </p>
        </div>
      </Link>
    </EntityHoverPreview>
  );
}

export function RecurringTemplateRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 p-2.5 sm:p-3">
      <div className="aspect-square size-[4.25rem] sm:size-[4.75rem] shrink-0 self-center overflow-hidden rounded-lg">
        <Skeleton height="100%" width="100%" className="!rounded-lg !leading-none block" />
      </div>
      <div className="min-w-0 flex-1 py-0.5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton height={14} width="62%" />
          <Skeleton height={14} width={56} />
        </div>
        <Skeleton height={12} width="55%" />
        <Skeleton height={12} width="65%" />
        <Skeleton height={12} width="70%" />
      </div>
    </div>
  );
}
