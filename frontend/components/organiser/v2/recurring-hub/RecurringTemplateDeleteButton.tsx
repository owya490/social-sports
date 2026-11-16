"use client";

import { OrganiserDeleteConfirmDialog } from "@/components/organiser/v2/OrganiserDeleteConfirmDialog";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { deleteRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("RecurringTemplateDeleteButton");

type RecurringTemplateDeleteButtonProps = {
  recurrenceTemplateId: RecurrenceTemplateId;
  templateName: string;
  disabled?: boolean;
};

export function RecurringTemplateDeleteButton({
  recurrenceTemplateId,
  templateName,
  disabled = false,
}: RecurringTemplateDeleteButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const name = templateName.trim() || "this template";

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setError(false);
  };

  const handleDelete = async () => {
    if (disabled || deleting) return;
    setDeleting(true);
    setError(false);
    try {
      await deleteRecurrenceTemplate(recurrenceTemplateId);
      router.push("/organiser/v2/event/recurring-events");
    } catch (deleteError) {
      setDeleting(false);
      setError(true);
      logger.error(`Failed to delete recurrence template ${recurrenceTemplateId}: ${deleteError}`);
    }
  };

  return (
    <>
      <Menu as="div" className="relative shrink-0">
        <MenuButton
          type="button"
          disabled={disabled || deleting}
          aria-label="Template actions"
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
                onClick={() => {
                  setError(false);
                  setConfirmOpen(true);
                }}
                className={`${
                  focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium`}
              >
                <TrashIcon className="h-4 w-4 shrink-0 text-danger" aria-hidden />
                Delete template
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      <OrganiserDeleteConfirmDialog
        open={confirmOpen}
        title="Delete recurring event"
        subjectName={name}
        detail="All references to this Recurring event will be deleted. Existing events will not be modified."
        errorMessage={error ? "Could not delete this template. Try again." : null}
        deleting={deleting}
        confirmDisabled={disabled}
        onClose={closeConfirm}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </>
  );
}
