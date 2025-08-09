
// Tailwind default breakpoints (can adjust if you use custom config)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Returns current window width.
 */
export function getWindowWidth() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
}

/**
 * Checks if screen width is less than or equal to given breakpoint.
 * @param {string} bp - breakpoint key (sm, md, lg, xl, 2xl)
 * @returns {boolean}
 */
export function isScreenBelow(bp: keyof typeof breakpoints) {
  const width = getWindowWidth();
  return width <= (breakpoints[bp] || 0);
}

/**
 * Checks if screen width is greater than or equal to given breakpoint.
 * @param {string} bp - breakpoint key (sm, md, lg, xl, 2xl)
 * @returns {boolean}
 */
export function isScreenAbove(bp: keyof typeof breakpoints) {
  const width = getWindowWidth();
  return width >= (breakpoints[bp] || 0);
}
