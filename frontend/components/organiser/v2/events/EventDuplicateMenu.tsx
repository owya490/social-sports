"use client";

import { welcomeAwareEventHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
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

type EventDuplicateMenuProps = {
  event: EventData;
  disabled?: boolean;
};

export function EventDuplicateMenu({ event, disabled = false }: EventDuplicateMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (disabled || duplicating) return;
    setDuplicating(true);
    try {
      const newEventId = await createEvent(buildDuplicatedNewEventData(event));
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
        <MenuItem disabled={duplicating}>
          {({ focus, disabled: itemDisabled }) => (
            <button
              type="button"
              onClick={() => {
                void handleDuplicate();
              }}
              disabled={itemDisabled}
              className={`${
                focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
              } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium disabled:opacity-50`}
            >
              <DocumentDuplicateIcon className="h-4 w-4 shrink-0" aria-hidden />
              {duplicating ? "Duplicating…" : "Duplicate event"}
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
