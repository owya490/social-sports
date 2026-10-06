"use client";

import { welcomeAwareEventHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import {
  EventHubScheduleFields,
  type EventHubScheduleValue,
} from "@/components/organiser/v2/event-hub/EventHubScheduleFields";
import { EventHubPrimaryButton } from "@/components/organiser/v2/event-hub/EventHubStage";
import { EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { createEvent } from "@/services/src/events/eventsService";
import { buildDuplicatedNewEventData } from "@/services/src/events/eventsUtils/duplicateEventUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { DocumentDuplicateIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("EventDuplicateMenu");

function copyTitle(eventName: string) {
  return `Copy of ${eventName.trim() || "event"}`;
}

type EventDuplicateMenuProps = {
  event: EventData;
  disabled?: boolean;
};

export function EventDuplicateMenu({ event, disabled = false }: EventDuplicateMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [name, setName] = useState(copyTitle(event.name));
  const [schedule, setSchedule] = useState<EventHubScheduleValue | null>(null);

  const closePanel = () => {
    if (duplicating) return;
    setOpen(false);
  };

  const openPanel = () => {
    setName(copyTitle(event.name));
    setSchedule(null);
    setOpen(true);
  };

  const handleDuplicate = async () => {
    const nextName = name.trim();
    if (disabled || duplicating || !schedule || schedule.hasBlockingWarning || !nextName) return;
    setDuplicating(true);
    try {
      const newEventId = await createEvent(
        buildDuplicatedNewEventData(event, {
          name: nextName,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          registrationDeadline: schedule.registrationDeadline,
        })
      );
      bustOrganiserEventsCache();
      router.push(welcomeAwareEventHref(pathname, newEventId));
    } catch (error) {
      setDuplicating(false);
      if (error === "Rate Limited") {
        router.push("/error/CREATE_UPDATE_EVENT_RATELIMITED");
        return;
      }
      logger.error(`Failed to duplicate event ${event.eventId}: ${error}`);
      router.push("/error");
    }
  };

  return (
    <>
      <Menu as="div" className="relative shrink-0">
        <MenuButton
          type="button"
          disabled={disabled || duplicating}
          aria-label="Event actions"
          className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
        </MenuButton>
        <MenuItems
          transition
          anchor="bottom end"
          modal={false}
          className="z-[100] w-44 origin-top-right rounded-xl border border-border bg-background p-1 shadow-lg outline-none [--anchor-gap:4px] data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={openPanel}
                className={`${
                  focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium`}
              >
                <DocumentDuplicateIcon className="h-4 w-4 shrink-0" aria-hidden />
                Duplicate event
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      <EventHubPanel
        open={open}
        onClose={closePanel}
        title="Duplicate event"
        footer={
          <EventHubPrimaryButton
            onClick={() => {
              void handleDuplicate();
            }}
            disabled={disabled || duplicating || !name.trim() || !schedule || schedule.hasBlockingWarning}
          >
            {duplicating ? "Duplicating…" : "Duplicate"}
          </EventHubPrimaryButton>
        }
      >
        {open ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                aria-label="Event title"
                placeholder="Event title"
                className="w-full border-0 border-b border-border bg-transparent px-0 py-2 text-xl font-semibold tracking-tight text-foreground font-sans placeholder:text-foreground-muted focus:border-focus focus:outline-none focus-visible:outline-none"
              />
              <p className="text-sm text-foreground-muted font-sans leading-relaxed">
                Create a copy of{" "}
                <span className="font-semibold text-foreground">{event.name || "this event"}</span>.
                <span className="block mt-1.5">You can edit the new event after.</span>
              </p>
            </div>
            <EventHubScheduleFields
              eventStartDate={event.startDate}
              eventEndDate={event.endDate}
              eventRegistrationDeadline={event.registrationDeadline}
              onChange={setSchedule}
            />
          </div>
        ) : null}
      </EventHubPanel>
    </>
  );
}
