"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

type OrganiserDeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  subjectName: string;
  detail: string;
  errorMessage?: string | null;
  deleting: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function OrganiserDeleteConfirmDialog({
  open,
  title,
  subjectName,
  detail,
  errorMessage = null,
  deleting,
  confirmDisabled = false,
  onClose,
  onConfirm,
}: OrganiserDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[120]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg">
          <DialogTitle className="font-sans text-base font-semibold text-foreground">{title}</DialogTitle>
          <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed">
            You are about to delete <span className="font-semibold text-foreground">{subjectName}</span>.
          </p>
          <p className="mt-2 text-sm text-foreground-secondary font-sans leading-relaxed">{detail}</p>
          {errorMessage ? (
            <p className="mt-3 text-sm text-danger font-sans" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-xl px-3 py-2 text-sm font-medium text-foreground-secondary font-sans hover:bg-surface-hover hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled || deleting}
              className="rounded-xl bg-danger px-3 py-2 text-sm font-semibold text-white font-sans hover:brightness-95 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
