"use client";

import { welcomeAwareEventHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { EventData } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { createEvent } from "@/services/src/events/eventsService";
import { buildDuplicatedNewEventData } from "@/services/src/events/eventsUtils/duplicateEventUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const closeConfirm = () => {
    if (duplicating) return;
    setConfirmOpen(false);
  };

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
                onClick={() => setConfirmOpen(true)}
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

      <Dialog open={confirmOpen} onClose={closeConfirm} className="relative z-[110]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-[0_8px_28px_rgba(10,10,10,0.12)]">
            <DialogTitle className="text-base font-semibold text-foreground font-sans tracking-tight">
              Duplicate event?
            </DialogTitle>
            <p className="mt-2 text-sm text-foreground-muted font-sans leading-relaxed">
              Create a copy of{" "}
              <span className="font-semibold text-foreground">{event.name || "this event"}</span>.
              <span className="block mt-1.5">You can edit the new event after.</span>
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={duplicating}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDuplicate();
                }}
                disabled={duplicating}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40"
              >
                {duplicating ? "Duplicating…" : "Duplicate"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
