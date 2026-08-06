"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ChevronDoubleRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, ReactNode } from "react";

/**
 * Luma-style operate panel: right drawer on desktop, bottom sheet on mobile.
 * One DialogPanel — responsive positioning — so a11y tree stays singular.
 */

type EventHubPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function EventHubPanel({ open, onClose, title, children, footer, wide = false }: EventHubPanelProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden flex items-end md:items-stretch md:justify-end pointer-events-none">
            <TransitionChild
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-y-full md:translate-y-0 md:translate-x-full"
              enterTo="translate-y-0 md:translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-y-0 md:translate-x-0"
              leaveTo="translate-y-full md:translate-y-0 md:translate-x-full"
            >
              <DialogPanel
                className={`pointer-events-auto flex w-full flex-col border-border bg-background ${
                  wide ? "md:max-w-xl" : "md:max-w-lg"
                } max-h-[92vh] md:max-h-none md:h-full rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l shadow-[0_-8px_28px_rgba(10,10,10,0.12)] md:shadow-[0_0_40px_rgba(10,10,10,0.08)]`}
              >
                <div className="flex justify-center pt-2.5 pb-1 md:hidden" aria-hidden>
                  <span className="h-1 w-10 rounded-full bg-surface-muted" />
                </div>

                <div className="flex items-center gap-2 shrink-0 px-4 sm:px-5 py-3 border-b border-border">
                  <button
                    type="button"
                    onClick={onClose}
                    className="hidden md:inline-flex rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    aria-label="Close panel"
                  >
                    <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden />
                  </button>
                  <DialogTitle className="flex-1 min-w-0 text-base font-semibold text-foreground font-sans tracking-tight">
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="md:hidden rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">{children}</div>

                {footer ? (
                  <div className="shrink-0 border-t border-border px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 bg-background">
                    {footer}
                  </div>
                ) : null}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
