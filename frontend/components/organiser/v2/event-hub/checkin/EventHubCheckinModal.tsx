"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { EventHubGhostButton, EventHubPrimaryButton } from "../EventHubStage";
import { ScannedTicketPreview } from "./parseTicketQr";

type EventHubCheckinModalProps = {
  preview: ScannedTicketPreview | null;
  onCancel: () => void;
  onCheckIn: () => void;
};

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-foreground-muted font-sans">{label}</dt>
      <dd className={`mt-0.5 text-sm text-foreground break-all ${mono ? "font-mono" : "font-sans"}`}>
        {value}
      </dd>
    </div>
  );
}

export function EventHubCheckinModal({ preview, onCancel, onCheckIn }: EventHubCheckinModalProps) {
  const open = preview !== null;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-sm transform rounded-2xl border border-border bg-background p-5 shadow-[0_12px_40px_rgba(10,10,10,0.16)]">
                <DialogTitle className="text-base font-semibold text-foreground font-sans tracking-tight">
                  Ticket
                </DialogTitle>
                {preview ? (
                  <dl className="mt-3 space-y-2.5">
                    <DetailRow label="Name" value={preview.name || "—"} />
                    <DetailRow label="Order ID" value={preview.orderId || "—"} mono />
                    <DetailRow label="Ticket ID" value={preview.ticketId} mono />
                    <DetailRow label="Details" value={preview.details || "—"} />
                  </dl>
                ) : null}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <EventHubGhostButton onClick={onCancel}>Cancel</EventHubGhostButton>
                  <EventHubPrimaryButton onClick={onCheckIn}>Check in</EventHubPrimaryButton>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
