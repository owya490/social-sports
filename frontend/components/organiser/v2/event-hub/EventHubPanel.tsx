"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  CSSProperties,
  Fragment,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  TransitionEvent as ReactTransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Luma-style operate panel: right drawer on desktop, bottom sheet on mobile.
 * One DialogPanel — responsive positioning — so a11y tree stays singular.
 * Mobile: drag the handle (or header) to expand toward ~95vh or dismiss.
 * Resize uses translateY on an inner shell (not height animation) so enter/leave
 * transforms on DialogPanel stay intact and the gesture stays compositor-friendly.
 */

const EXPANDED_VH = 0.95;
const DISMISS_TRANSLATE_PX = 120;
const MIN_VISIBLE_PX = 160;
const MD_QUERY = "(min-width: 768px)";

type EventHubPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia(MD_QUERY).matches;
}

function expandedHeightPx() {
  return Math.round(window.innerHeight * EXPANDED_VH);
}

export function EventHubPanel({ open, onClose, title, children, footer, wide = false }: EventHubPanelProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  /** When set, mobile sheet is locked to expanded height; visibility is via translateY. */
  const [expandedLock, setExpandedLock] = useState(false);
  /** Positive = sheet shifted down (less of the 95vh panel visible). */
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const translateRef = useRef(0);
  const restingVisibleRef = useRef<number | null>(null);
  const pendingCollapseRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startClientY: number;
    startTranslateY: number;
    maxH: number;
  } | null>(null);

  useEffect(() => {
    translateRef.current = translateY;
  }, [translateY]);

  useEffect(() => {
    if (!open) {
      setExpandedLock(false);
      setTranslateY(0);
      setIsDragging(false);
      translateRef.current = 0;
      restingVisibleRef.current = null;
      pendingCollapseRef.current = false;
      dragRef.current = null;
    }
  }, [open]);

  const settleCollapsed = useCallback(() => {
    pendingCollapseRef.current = false;
    setExpandedLock(false);
    setTranslateY(0);
    translateRef.current = 0;
  }, []);

  const settleExpanded = useCallback(() => {
    pendingCollapseRef.current = false;
    setExpandedLock(true);
    setTranslateY(0);
    translateRef.current = 0;
  }, []);

  const beginDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (isDesktopViewport()) return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      if ((e.target as HTMLElement).closest("button")) return;

      e.preventDefault();
      pendingCollapseRef.current = false;

      const maxH = expandedHeightPx();
      const visible = sheet.getBoundingClientRect().height;
      if (restingVisibleRef.current === null) {
        restingVisibleRef.current = Math.min(visible, maxH);
      }

      // Promote to full sheet height; compensate with translateY so the top edge doesn't jump.
      const startTranslateY = expandedLock ? translateRef.current : Math.max(0, maxH - visible);
      setExpandedLock(true);
      setTranslateY(startTranslateY);
      translateRef.current = startTranslateY;

      dragRef.current = {
        pointerId: e.pointerId,
        startClientY: e.clientY,
        startTranslateY,
        maxH,
      };
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [expandedLock],
  );

  const onDragMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;

    const delta = e.clientY - drag.startClientY; // down → larger translate
    const maxTranslate = Math.max(0, drag.maxH - MIN_VISIBLE_PX);
    const next = Math.min(maxTranslate, Math.max(0, drag.startTranslateY + delta));
    translateRef.current = next;
    setTranslateY(next);
  }, []);

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;

      dragRef.current = null;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const current = translateRef.current;
      const restingVisible = restingVisibleRef.current ?? drag.maxH;
      const collapsedTranslate = Math.max(0, drag.maxH - restingVisible);

      if (current >= collapsedTranslate + DISMISS_TRANSLATE_PX) {
        onClose();
        return;
      }

      const mid = collapsedTranslate / 2;
      if (current <= mid) {
        settleExpanded();
        return;
      }

      // Animate back to the content-sized peek, then drop the 95vh lock.
      if (Math.abs(current - collapsedTranslate) < 2) {
        settleCollapsed();
        return;
      }
      pendingCollapseRef.current = true;
      translateRef.current = collapsedTranslate;
      setTranslateY(collapsedTranslate);
    },
    [onClose, settleCollapsed, settleExpanded],
  );

  const onSheetTransitionEnd = useCallback(
    (e: ReactTransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (!pendingCollapseRef.current) return;
      settleCollapsed();
    },
    [settleCollapsed],
  );

  const toggleExpanded = useCallback(() => {
    if (isDesktopViewport()) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (expandedLock && translateY < 8) {
      const maxH = expandedHeightPx();
      const restingVisible = restingVisibleRef.current ?? sheet.getBoundingClientRect().height;
      const collapsedTranslate = Math.max(0, maxH - restingVisible);
      pendingCollapseRef.current = true;
      setTranslateY(collapsedTranslate);
      translateRef.current = collapsedTranslate;
      return;
    }

    const maxH = expandedHeightPx();
    const visible = sheet.getBoundingClientRect().height;
    if (restingVisibleRef.current === null) {
      restingVisibleRef.current = Math.min(visible, maxH);
    }
    settleExpanded();
  }, [expandedLock, settleExpanded, translateY]);

  const sheetStyle: CSSProperties | undefined =
    open && expandedLock
      ? {
          height: `${EXPANDED_VH * 100}vh`,
          maxHeight: `${EXPANDED_VH * 100}vh`,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
        }
      : undefined;

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
                className={`pointer-events-auto flex w-full flex-col ${wide ? "md:max-w-xl" : "md:max-w-lg"} md:h-full`}
              >
                <div
                  ref={sheetRef}
                  style={sheetStyle}
                  onTransitionEnd={onSheetTransitionEnd}
                  className="flex w-full flex-col border-border bg-background max-h-[95vh] md:h-full md:max-h-none md:!transform-none md:transition-none rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l shadow-[0_-8px_28px_rgba(10,10,10,0.12)] md:shadow-[0_0_40px_rgba(10,10,10,0.08)]"
                >
                  <div
                    className="flex justify-center pt-3 pb-2 md:hidden touch-none cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={beginDrag}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onDoubleClick={toggleExpanded}
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Drag to resize panel"
                  >
                    <span className="h-1 w-10 rounded-full bg-surface-muted" aria-hidden />
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0 px-4 sm:px-5 py-3 border-b border-border md:touch-auto touch-none md:cursor-auto cursor-grab active:cursor-grabbing select-none md:select-auto"
                    onPointerDown={beginDrag}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    <button
                      type="button"
                      onClick={onClose}
                      className="hidden md:inline-flex rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label="Close panel"
                    >
                      <ChevronRightIcon className="h-5 w-5" aria-hidden />
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

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">{children}</div>

                  {footer ? (
                    <div className="shrink-0 border-t border-border px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 bg-background">
                      {footer}
                    </div>
                  ) : null}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
