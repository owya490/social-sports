import { useSyncExternalStore } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
export const ORGANISER_V2_CANVAS = "#f7f7f7";

/** One step away from the canvas so browsers re-apply theme-color on close. */
const ORGANISER_V2_CANVAS_NUDGE = "#f8f8f8";

export type OrganiserV2OverlayFrame = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Layout-viewport `inset: 0` overlays paint behind iOS Safari's URL bar
 * (`100vh`). Size the scrim to the visual viewport instead so Clubhouse Grey
 * remains what the browser chrome samples.
 */
export function overlayFrameFromVisualViewport(
  viewport: Pick<VisualViewport, "offsetTop" | "offsetLeft" | "width" | "height"> | null,
  fallback: { innerWidth: number; innerHeight: number }
): OrganiserV2OverlayFrame {
  if (!viewport) {
    return { top: 0, left: 0, width: fallback.innerWidth, height: fallback.innerHeight };
  }
  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
  };
}

export function overlayFrameStyle(frame: OrganiserV2OverlayFrame): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
  };
}

function replaceThemeColor(color: string) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.setAttribute("content", color);
  document.head.appendChild(meta);
}

export function lockOrganiserV2Chrome() {
  const root = document.documentElement;
  root.style.backgroundColor = ORGANISER_V2_CANVAS;
  root.style.colorScheme = "light";
  document.body.style.backgroundColor = ORGANISER_V2_CANVAS;
  replaceThemeColor(ORGANISER_V2_CANVAS);
}

/** Force browsers that cached the dim overlay as chrome tint to re-sample grey. */
export function nudgeOrganiserV2Chrome() {
  replaceThemeColor(ORGANISER_V2_CANVAS_NUDGE);
  document.documentElement.style.backgroundColor = ORGANISER_V2_CANVAS_NUDGE;
  document.body.style.backgroundColor = ORGANISER_V2_CANVAS_NUDGE;
  requestAnimationFrame(() => {
    replaceThemeColor(ORGANISER_V2_CANVAS);
    document.documentElement.style.backgroundColor = ORGANISER_V2_CANVAS;
    document.body.style.backgroundColor = ORGANISER_V2_CANVAS;
  });
}

function subscribeVisualViewport(onChange: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", onChange);
  viewport?.addEventListener("scroll", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    viewport?.removeEventListener("resize", onChange);
    viewport?.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function subscribeNoop() {
  return () => undefined;
}

let cachedFrame: OrganiserV2OverlayFrame | null = null;

function getVisualViewportSnapshot(): OrganiserV2OverlayFrame {
  const next = overlayFrameFromVisualViewport(window.visualViewport, {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  });
  if (
    cachedFrame &&
    cachedFrame.top === next.top &&
    cachedFrame.left === next.left &&
    cachedFrame.width === next.width &&
    cachedFrame.height === next.height
  ) {
    return cachedFrame;
  }
  cachedFrame = next;
  return next;
}

function getInactiveSnapshot(): OrganiserV2OverlayFrame | null {
  return null;
}

export function useVisualViewportOverlayFrame(active: boolean): OrganiserV2OverlayFrame | null {
  return useSyncExternalStore(
    active ? subscribeVisualViewport : subscribeNoop,
    active ? getVisualViewportSnapshot : getInactiveSnapshot,
    getInactiveSnapshot
  );
}
