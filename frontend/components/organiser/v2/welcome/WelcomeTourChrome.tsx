"use client";

import { LOADING_BEATS } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Explicit rgba — Tailwind opacity modifiers can fail on CSS-variable colors. */
export const WELCOME_DIM = "rgba(10, 10, 10, 0.62)";
const DIM_SHADOW = `0 0 0 9999px ${WELCOME_DIM}`;
const SPOT_MOVE_MS = 420;
const TIP_DELAY_AFTER_MOVE_MS = 60;
/** Sports yellow — matches DESIGN.md accent. */
const ACCENT = "#F2B705";
const ACCENT_SOFT = "rgba(242, 183, 5, 0.45)";
const ACCENT_STRONG = "rgba(242, 183, 5, 0.85)";

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PAD = 8;

export function measureTourTarget(selector: string): SpotlightRect | null {
  const nodes = document.querySelectorAll(selector);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.getAttribute("aria-hidden") === "true") continue;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = node.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // Skip off-screen drawers (e.g. closed mobile sidebar).
    if (r.right < 8 || r.bottom < 8 || r.left > vw - 8) continue;
    // Pad symmetrically around the target, then clip to the viewport.
    // (Previously clamping left/top independently of width/height shifted the box off-center.)
    const top = Math.max(0, r.top - PAD);
    const left = Math.max(0, r.left - PAD);
    const right = Math.min(vw, r.right + PAD);
    const bottom = Math.min(vh, r.bottom + PAD);
    return {
      top: Math.round(top),
      left: Math.round(left),
      width: Math.max(0, Math.round(right) - Math.round(left)),
      height: Math.max(0, Math.round(bottom) - Math.round(top)),
    };
  }
  return null;
}

export function scrollTourTargetIntoView(selector: string) {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.getAttribute("aria-hidden") === "true") continue;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = node.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.right < 8 || r.bottom < 8 || r.left > window.innerWidth - 8) continue;
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return;
  }
}

export function tipPlacementStyle(spot: SpotlightRect | null): CSSProperties {
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  if (!spot) return { bottom: 24 };
  const tipAbove = spot.top + spot.height > viewportH * 0.55 && spot.top > 200;
  if (tipAbove) return { bottom: Math.max(16, viewportH - spot.top + 14) };
  return { top: Math.min(spot.top + spot.height + 14, viewportH - 220) };
}

function spotKey(spot: SpotlightRect | null) {
  if (!spot) return "none";
  return `${Math.round(spot.top)}:${Math.round(spot.left)}:${Math.round(spot.width)}:${Math.round(spot.height)}`;
}

type WelcomeSpotlightProps = {
  spot: SpotlightRect | null;
  tipStyle: CSSProperties;
  title: string;
  body: string;
  progressLabel: string;
  onSkip: () => void;
  titleId?: string;
  /** Default: next button. click-through leaves the hole open for real UI clicks. */
  interaction?: "next" | "click-through";
  primaryLabel?: string;
  onPrimary?: () => void;
  onBack?: () => void;
  clickHint?: string;
};

/**
 * Transparent panels block clicks outside the hole during click-through.
 * Visual dimming always comes from the box-shadow ring.
 */
function ClickBlockCutout({ spot }: { spot: SpotlightRect }) {
  const block = "absolute pointer-events-auto";
  return (
    <>
      <div className={block} style={{ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) }} />
      <div
        className={block}
        style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height }}
      />
      <div
        className={block}
        style={{
          top: spot.top,
          left: spot.left + spot.width,
          right: 0,
          height: spot.height,
        }}
      />
      <div
        className={block}
        style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0 }}
      />
    </>
  );
}

/**
 * Spotlight chrome: highlight box moves first, tip card pops in after the move settles.
 * Keep this mounted across steps (stable key) so the box can animate between targets.
 */
export function WelcomeSpotlight({
  spot,
  tipStyle,
  title,
  body,
  progressLabel,
  onSkip,
  onBack,
  onPrimary,
  primaryLabel = "Next",
  interaction = "next",
  clickHint,
  titleId = "organiser-tour-title",
}: WelcomeSpotlightProps) {
  const reduceMotion = useReducedMotion();
  const clickThrough = interaction === "click-through";
  const moveMs = reduceMotion ? 0 : SPOT_MOVE_MS;

  const [ringSpot, setRingSpot] = useState<SpotlightRect | null>(spot);
  const [showTip, setShowTip] = useState(false);
  const targetKey = `${spotKey(spot)}:${title}`;

  useEffect(() => {
    setShowTip(false);

    if (!spot) {
      setRingSpot(null);
      return;
    }

    // Drive the ring to the new target, then reveal the tip after the move settles.
    setRingSpot(spot);
    const delay = moveMs + TIP_DELAY_AFTER_MOVE_MS;
    const t = window.setTimeout(() => setShowTip(true), delay);
    return () => window.clearTimeout(t);
    // spotKey via targetKey — avoid re-running on identical geometry from measure retries
    // eslint-disable-next-line react-hooks/exhaustive-deps -- spot read when targetKey changes
  }, [targetKey, moveMs]);

  const tipAbove = Boolean(
    ringSpot && typeof window !== "undefined" && ringSpot.top > window.innerHeight * 0.4
  );

  const ringRadius = (() => {
    if (!ringSpot || typeof window === "undefined") return 12;
    const flushLeft = ringSpot.left <= 0;
    const flushRight = ringSpot.left + ringSpot.width >= window.innerWidth;
    const flushTop = ringSpot.top <= 0;
    const flushBottom = ringSpot.top + ringSpot.height >= window.innerHeight;
    if (flushLeft || flushRight || flushTop || flushBottom) {
      return `${flushTop ? 0 : 12}px ${flushRight ? 0 : 12}px ${flushBottom ? 0 : 12}px ${flushLeft ? 0 : 12}px`;
    }
    return 12;
  })();

  return (
    <motion.div
      className={`fixed inset-0 z-[80] ${clickThrough ? "pointer-events-none" : "pointer-events-auto"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {!ringSpot && (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ backgroundColor: WELCOME_DIM }}
          aria-hidden
        />
      )}

      {ringSpot && (
        <>
          <motion.div
            className="pointer-events-none absolute border-2 border-background bg-transparent"
            initial={false}
            animate={{
              top: ringSpot.top,
              left: ringSpot.left,
              width: ringSpot.width,
              height: ringSpot.height,
              borderRadius: ringRadius,
            }}
            transition={{ duration: moveMs / 1000, ease: EASE }}
            style={{ boxShadow: DIM_SHADOW }}
            aria-hidden
          />
          {clickThrough && <ClickBlockCutout spot={ringSpot} />}
        </>
      )}

      <div className="absolute inset-x-0 z-10 flex justify-center px-4 pointer-events-none" style={tipStyle}>
        <AnimatePresence mode="wait">
          {showTip && (
            <motion.div
              key={title}
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-[0_14px_40px_rgba(10,10,10,0.22)]"
              initial={reduceMotion ? false : { y: tipAbove ? -10 : 10, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { y: tipAbove ? -6 : 6, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {progressLabel}
              </p>
              <h3 id={titleId} className="mt-1.5 font-sans text-lg font-bold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-foreground-secondary">{body}</p>
              {clickThrough && clickHint && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 font-sans text-xs font-semibold text-foreground">
                  <span className="organiser-welcome-click-pulse inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
                  {clickHint}
                </p>
              )}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onSkip}
                  className="rounded font-sans text-sm font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Skip
                </button>
                <div className="flex items-center gap-2">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="inline-flex items-center justify-center rounded-xl border border-border px-3.5 py-2 font-sans text-sm font-semibold text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      Back
                    </button>
                  )}
                  {!clickThrough && onPrimary && (
                    <button
                      type="button"
                      onClick={onPrimary}
                      className="inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 font-sans text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {primaryLabel}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function WelcomePrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3 font-sans text-sm font-semibold text-background transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
    >
      {children}
    </button>
  );
}

type WelcomeLoadingStageProps = {
  durationMs: number;
  reduceMotion: boolean | null;
};

/**
 * Black learning stage: Wrapped-style spinning rings + beat copy + progress.
 * First-use orientation — not a fake spinner.
 */
export function WelcomeLoadingStage({ durationMs, reduceMotion }: WelcomeLoadingStageProps) {
  const [beat, setBeat] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      setBeat(LOADING_BEATS.length - 1);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      setProgress(t);
      setBeat(Math.min(LOADING_BEATS.length - 1, Math.floor(t * LOADING_BEATS.length)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, reduceMotion]);

  const spin = (duration: number, reverse = false) =>
    reduceMotion
      ? undefined
      : {
          animate: { rotate: reverse ? -360 : 360 },
          transition: { duration, repeat: Infinity, ease: "linear" as const },
        };

  return (
    <motion.div
      key="loading"
      className="fixed inset-0 z-[81] flex flex-col items-center justify-center bg-foreground px-6"
      initial={false}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 1.03, filter: "blur(6px)" }
      }
      transition={{ duration: reduceMotion ? 0.15 : 0.42, ease: EASE }}
      aria-busy="true"
      aria-label="Loading Organiser Hub v2"
    >
      <motion.div
        className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        aria-hidden
      >
        {/* Outer spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-background/20"
          {...spin(3)}
        />

        {/* Middle spinning ring — yellow accent */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: ACCENT_STRONG,
            borderRightColor: ACCENT_SOFT,
          }}
          {...spin(2, true)}
        />

        {/* Inner spinning ring */}
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "rgba(255, 255, 255, 0.8)",
            borderLeftColor: "rgba(255, 255, 255, 0.3)",
          }}
          {...spin(1.5)}
        />

        {/* Orbiting dots */}
        <motion.div className="absolute inset-0" {...spin(4)}>
          <div
            className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1 rounded-full shadow-lg"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 14px ${ACCENT_SOFT}` }}
          />
        </motion.div>

        <motion.div className="absolute inset-0" {...spin(3, true)}>
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rounded-full bg-background shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
        </motion.div>

        {/* Center SPORTSHUB logo with pulse */}
        <motion.div
          className="absolute inset-6 flex items-center justify-center"
          animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Image
            src="/icons/Icon_white.svg"
            alt=""
            width={56}
            height={56}
            className="h-12 w-12 drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] sm:h-14 sm:w-14"
            priority
          />
        </motion.div>
      </motion.div>

      <motion.p
        className="mt-8 font-sans text-base font-bold tracking-tight text-background sm:text-lg"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.12, ease: EASE }}
      >
        Organiser Hub v2
      </motion.p>

      <div className="mt-2.5 flex h-5 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={LOADING_BEATS[beat]}
            className="font-sans text-xs font-medium tracking-wide text-background/70 sm:text-sm"
            initial={reduceMotion ? false : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -10, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {LOADING_BEATS[beat]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        className="mt-9 h-0.5 w-44 overflow-hidden rounded-full bg-background/15 sm:w-52"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full origin-left rounded-full transition-none"
          style={{ transform: `scaleX(${progress})`, backgroundColor: ACCENT }}
        />
      </div>
    </motion.div>
  );
}

export { AnimatePresence, motion, useReducedMotion, EASE };
