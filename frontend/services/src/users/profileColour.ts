/** Default SPORTSHUB sports-yellow accent — matches DESIGN.md / globals.css. */
export const DEFAULT_PROFILE_COLOUR = "#f2b705";

export type ProfileColourOption = {
  label: string;
  value: string;
};

/** Constrained palette for profile / organiser-hub accents. */
export const PROFILE_COLOUR_OPTIONS: readonly ProfileColourOption[] = [
  { label: "Sports yellow", value: "#f2b705" },
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Pink", value: "#db2777" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Red", value: "#dc2626" },
  { label: "Indigo", value: "#4f46e5" },
] as const;

const PROFILE_COLOUR_VALUES = new Set(PROFILE_COLOUR_OPTIONS.map((option) => option.value.toLowerCase()));

const HEX_COLOUR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance for sRGB hex (`#rrggbb`). */
export function relativeLuminance(hex: string): number {
  const normalised = hex.replace("#", "");
  const r = channelToLinear(parseInt(normalised.slice(0, 2), 16));
  const g = channelToLinear(parseInt(normalised.slice(2, 4), 16));
  const b = channelToLinear(parseInt(normalised.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white text for readable contrast on the given accent fill. */
export function accentContrastFor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0a0a0a" : "#ffffff";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalised = hex.replace("#", "");
  return {
    r: parseInt(normalised.slice(0, 2), 16),
    g: parseInt(normalised.slice(2, 4), 16),
    b: parseInt(normalised.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

/**
 * Darker companion shade of the accent (same hue, lower lightness).
 * Used for selection rings / pairing with the primary profile colour.
 */
export function darkerCompanionFor(hex: string, amount = 0.28): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const darkened = Math.max(0.12, l * (1 - amount));
  const rgb = hslToRgb(h, s, darkened);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function isAllowedProfileColour(value: string | null | undefined): value is string {
  if (!value || !HEX_COLOUR_PATTERN.test(value)) return false;
  return PROFILE_COLOUR_VALUES.has(value.toLowerCase());
}

/** Resolve a stored profile colour to a safe accent hex (defaults to sports yellow). */
export function resolveProfileColour(value: string | null | undefined): string {
  if (isAllowedProfileColour(value)) return value.toLowerCase();
  return DEFAULT_PROFILE_COLOUR;
}
