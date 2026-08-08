"use client";

/**
 * THESIS: Cover-led mini-dossier hover — photo + three ops KPIs + short prose + flags;
 * refuses a second copy of the list row.
 * OWN-WORLD: Honest Clubhouse — white card, soft shadow, 12px radius, Satoshi, yellow only on focus elsewhere.
 * STORY: Organiser glances and knows whether to open (spots, deadline, views, exceptions).
 * FIRST VIEWPORT: Full-width cover → title → KPI strip → description → middot flags.
 * FORM: Cover-led stack (comp A); seed key delegated-cover-led-a (picker closed twice — assumed cover-led).
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const OPEN_DELAY_MS = 650;
const CLOSE_DELAY_MS = 160;
const PREVIEW_WIDTH = 360;
const SIDE_GAP = 14;
const VIEWPORT_PAD = 12;

type Position = {
  top: number;
  left: number;
  fromBelow: boolean;
};

export type EntityHoverPreviewProps = {
  children: ReactNode;
  /** Full-width cover band. Prefer over a leading thumb — the dossier identity. */
  cover?: ReactNode;
  title: string;
  /** Optional one-line identity under the title (sport, series cadence). */
  subtitle?: ReactNode;
  /** Three-cell (or fewer) KPI strip — the glanceable ops answer. */
  metrics?: ReactNode;
  /** Short prose or secondary lists — never nested panels. */
  body?: ReactNode;
  /** Exception / status line at the foot. */
  flags?: ReactNode;
  disabled?: boolean;
  className?: string;
};

function canUseHoverPreview(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Pin near the cursor. Flip to keep the card on-screen.
 * If it would cover the list row, nudge vertically off the row while keeping X near the cursor.
 */
function positionNearCursor(
  cursor: { x: number; y: number },
  row: DOMRect,
  cardWidth: number,
  cardHeight: number,
): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = Math.max(VIEWPORT_PAD, vw - VIEWPORT_PAD - cardWidth);
  const maxTop = Math.max(VIEWPORT_PAD, vh - VIEWPORT_PAD - cardHeight);

  let left = cursor.x + SIDE_GAP;
  let top = cursor.y + SIDE_GAP;
  let fromBelow = false;

  if (left + cardWidth > vw - VIEWPORT_PAD) {
    left = cursor.x - SIDE_GAP - cardWidth;
  }
  left = Math.min(Math.max(VIEWPORT_PAD, left), maxLeft);

  if (top + cardHeight > vh - VIEWPORT_PAD) {
    top = cursor.y - SIDE_GAP - cardHeight;
    fromBelow = true;
  }
  top = Math.min(Math.max(VIEWPORT_PAD, top), maxTop);

  const overlapsRow =
    left < row.right - 8 &&
    left + cardWidth > row.left + 8 &&
    top < row.bottom - 8 &&
    top + cardHeight > row.top + 8;

  if (overlapsRow) {
    const spaceAbove = row.top - VIEWPORT_PAD;
    const spaceBelow = vh - VIEWPORT_PAD - row.bottom;
    const preferAbove = cursor.y < row.top + row.height / 2;

    if (preferAbove && spaceAbove >= Math.min(cardHeight, 120)) {
      top = Math.max(VIEWPORT_PAD, row.top - SIDE_GAP - cardHeight);
      fromBelow = true;
    } else if (spaceBelow >= Math.min(cardHeight, 120)) {
      top = Math.min(row.bottom + SIDE_GAP, maxTop);
      fromBelow = false;
    } else if (spaceAbove >= spaceBelow) {
      top = Math.max(VIEWPORT_PAD, row.top - SIDE_GAP - cardHeight);
      fromBelow = true;
    } else {
      top = Math.min(row.bottom + SIDE_GAP, maxTop);
      fromBelow = false;
    }
    top = Math.min(Math.max(VIEWPORT_PAD, top), maxTop);
  }

  return { top, left, fromBelow };
}

/**
 * Shared hover preview shell for organiser hub entity lists.
 * Cover-led mini-dossier: open/close, cursor pin, portal, and motion live here once.
 */
export function EntityHoverPreview({
  children,
  cover,
  title,
  subtitle,
  metrics,
  body,
  flags,
  disabled = false,
  className = "",
}: EntityHoverPreviewProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const pinnedRef = useRef(false);
  const openedByFocusRef = useRef(false);
  const previewId = useId();
  const reduceMotion = useReducedMotion();
  const cardWidth = PREVIEW_WIDTH;

  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(canUseHoverPreview());
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const clearTimers = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const pinPosition = useCallback(() => {
    const row = triggerRef.current?.getBoundingClientRect();
    if (!row) return;
    const cardHeight = cardRef.current?.offsetHeight ?? 320;
    const cursor = cursorRef.current ?? {
      x: row.left + row.width / 2,
      y: row.top + row.height / 2,
    };
    setPosition(positionNearCursor(cursor, row, cardWidth, cardHeight));
    pinnedRef.current = true;
  }, [cardWidth]);

  const scheduleOpen = useCallback(() => {
    if (disabled || !enabled) return;
    clearTimers();
    openTimer.current = window.setTimeout(() => {
      setOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearTimers, disabled, enabled]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      pinnedRef.current = false;
      openedByFocusRef.current = false;
      setPosition(null);
    }, CLOSE_DELAY_MS);
  }, [clearTimers]);

  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (pinnedRef.current) return;
    cursorRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleMouseEnter = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      openedByFocusRef.current = false;
      pinnedRef.current = false;
      cursorRef.current = { x: event.clientX, y: event.clientY };
      scheduleOpen();
    },
    [scheduleOpen],
  );

  const handleFocus = useCallback(() => {
    openedByFocusRef.current = true;
    const row = triggerRef.current?.getBoundingClientRect();
    if (row) {
      cursorRef.current = { x: row.right, y: row.top + row.height / 2 };
    }
    scheduleOpen();
  }, [scheduleOpen]);

  useLayoutEffect(() => {
    if (!open) {
      pinnedRef.current = false;
      return;
    }
    pinPosition();
    const frame = window.requestAnimationFrame(() => {
      pinPosition();
    });
    return () => window.cancelAnimationFrame(frame);
    // Intentionally only when `open` flips — card width is constant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      setOpen(false);
      pinnedRef.current = false;
      openedByFocusRef.current = false;
      setPosition(null);
      clearTimers();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const hasBody = Boolean(metrics || body || flags);

  const previewCard =
    open && position ? (
      <motion.div
        key="entity-hover-preview"
        ref={cardRef}
        id={previewId}
        role="tooltip"
        initial={
          reduceMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: position.fromBelow ? 6 : -6,
                scale: 0.98,
                filter: "blur(4px)",
              }
        }
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                y: position.fromBelow ? 4 : -4,
                scale: 0.98,
                filter: "blur(2px)",
              }
        }
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: cardWidth,
          zIndex: 80,
          pointerEvents: "none",
        }}
        className="rounded-xl border border-border bg-background shadow-[0_8px_28px_rgba(10,10,10,0.12)] overflow-hidden"
      >
        {cover ? <div className="shrink-0">{cover}</div> : null}

        <div className="p-3.5">
          <p className="text-sm font-semibold text-foreground font-sans leading-snug line-clamp-2">{title}</p>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-foreground-muted font-sans line-clamp-1">{subtitle}</div>
          ) : null}

          {hasBody ? (
            <div className="mt-3 space-y-3 text-xs font-sans">
              {metrics ? <div>{metrics}</div> : null}
              {body ? <div className="text-foreground-secondary">{body}</div> : null}
              {flags ? (
                <p className="text-foreground-secondary leading-snug pt-2.5 border-t border-border">{flags}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </motion.div>
    ) : null;

  return (
    <div
      ref={triggerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={scheduleClose}
      onFocus={handleFocus}
      onBlur={scheduleClose}
      aria-describedby={open ? previewId : undefined}
    >
      {children}
      {mounted && enabled && !disabled
        ? createPortal(<AnimatePresence>{previewCard}</AnimatePresence>, document.body)
        : null}
    </div>
  );
}

/** Full-bleed cover photo for the dossier band. */
export function EntityHoverCover({ src, alt = "" }: { src?: string; alt?: string }) {
  return (
    <div
      className="h-[7.5rem] w-full bg-surface-muted bg-cover bg-center"
      style={src ? { backgroundImage: `url(${src})` } : undefined}
      role="img"
      aria-label={alt || undefined}
      aria-hidden={!alt}
    />
  );
}

/** Three-cell (or fewer) KPI strip under the title — flush, no nested panel. */
export function HoverMetrics({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-2">{children}</div>;
}

export function HoverMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-xs leading-tight text-foreground-muted font-sans truncate">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground font-sans truncate leading-snug">
        {value}
      </p>
    </div>
  );
}

/** Labelled sequence of plain lines. */
export function HoverList({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-foreground-muted">{label}</p>
      <div className="mt-1.5 space-y-1">{children}</div>
    </div>
  );
}
