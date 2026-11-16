"use client";

import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { deleteRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
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

      <Dialog open={confirmOpen} onClose={closeConfirm} className="relative z-[120]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg">
            <DialogTitle className="font-sans text-base font-semibold text-foreground">
              Delete recurring event
            </DialogTitle>
            <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed">
              You are about to delete <span className="font-semibold text-foreground">{name}</span>.
            </p>
            <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed">
              All references to this Recurring event will be deleted. Existing events will not be modified.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-danger font-sans" role="alert">
                Could not delete this template. Try again.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleting}
                className="rounded-xl px-3 py-2 text-sm font-medium text-foreground-secondary font-sans hover:bg-surface-hover hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={disabled || deleting}
                className="rounded-xl bg-danger px-3 py-2 text-sm font-semibold text-white font-sans hover:brightness-95 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
