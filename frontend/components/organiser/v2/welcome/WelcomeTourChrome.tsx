"use client";

import LogoInvert from "@/public/images/BlackLogo-Invert.svg";
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

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PAD = 10;

export function measureTourTarget(selector: string): SpotlightRect | null {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.getAttribute("aria-hidden") === "true") continue;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const r = node.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // Skip off-screen drawers (e.g. closed mobile sidebar).
    if (r.right < 8 || r.bottom < 8 || r.left > window.innerWidth - 8) continue;
    return {
      top: Math.max(8, r.top - PAD),
      left: Math.max(8, r.left - PAD),
      width: Math.min(window.innerWidth - 16, r.width + PAD * 2),
      height: Math.min(window.innerHeight - 16, r.height + PAD * 2),
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
            className="pointer-events-none absolute rounded-xl border-2 border-background bg-transparent"
            initial={false}
            animate={{
              top: ringSpot.top,
              left: ringSpot.left,
              width: ringSpot.width,
              height: ringSpot.height,
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

/** Simple black stage: SPORTSHUB logo + white loading bar. */
export function WelcomeLoadingStage({ durationMs, reduceMotion }: WelcomeLoadingStageProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, reduceMotion]);

  return (
    <motion.div
      key="loading"
      className="fixed inset-0 z-[81] flex flex-col items-center justify-center bg-foreground"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: EASE }}
      aria-busy="true"
      aria-label="Loading Organiser Hub v2"
    >
      <Image
        src={LogoInvert}
        alt="SPORTSHUB"
        className="h-10 w-auto sm:h-12"
        priority
      />
      <div
        className="mt-10 h-0.5 w-44 overflow-hidden rounded-full bg-background/20 sm:w-52"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full origin-left rounded-full bg-background transition-none"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </motion.div>
  );
}

export { AnimatePresence, motion, useReducedMotion, EASE };
