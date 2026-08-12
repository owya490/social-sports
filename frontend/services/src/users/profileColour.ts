/**
 * Unset profile colour — Organiser Hub stays black/white until the user picks one.
 * EmptyPublicUserData uses this so unset users do not inherit a brand yellow flash.
 */
export const UNSET_PROFILE_COLOUR = "";

/** Neutral hub buttons while loading / when no profile colour is chosen. */
export const NEUTRAL_HUB_ACCENT = "#0a0a0a";
export const NEUTRAL_HUB_ACCENT_CONTRAST = "#ffffff";

export type ProfileColourOption = {
  label: string;
  /** Strong fill used on primary buttons / chart accents. */
  value: string;
  /** Companion for button label text on the fill. */
  light: string;
};

/**
 * Curated organiser accents. Bases are paired with readable light (or light-neutral) text.
 */
export const PROFILE_COLOUR_OPTIONS: readonly ProfileColourOption[] = [
  { label: "Empire Red", value: "#c41e3a", light: "#fecdd3" },
  { label: "Royal Blue", value: "#1d4ed8", light: "#bfdbfe" },
  { label: "Sports Hub Yellow", value: "#f2b705", light: "#0a0a0a" },
  { label: "Forest Green", value: "#166534", light: "#bbf7d0" },
  { label: "Purple", value: "#7e22ce", light: "#e9d5ff" },
  { label: "Grey", value: "#6b7280", light: "#f3f4f6" },
  { label: "Black", value: "#0a0a0a", light: "#f5f5f5" },
] as const;

const PROFILE_COLOUR_BY_VALUE = new Map(
  PROFILE_COLOUR_OPTIONS.map((option) => [option.value.toLowerCase(), option]),
);

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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalised = hex.replace("#", "");
  return {
    r: parseInt(normalised.slice(0, 2), 16),
    g: parseInt(normalised.slice(2, 4), 16),
    b: parseInt(normalised.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    Math.round(Math.min(255, Math.max(0, channel)))
      .toString(16)
      .padStart(2, "0");
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

function deriveLighterCompanion(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.2) return "#f5f5f5";
  if (relativeLuminance(hex) > 0.55) return "#0a0a0a";
  const lightL = Math.min(0.92, Math.max(0.78, l + 0.45));
  const softS = Math.min(0.55, s * 0.55);
  const rgb = hslToRgb(h, softS, lightL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/** Companion for button text on the accent fill (curated when available). */
export function lighterCompanionFor(hex: string): string {
  const option = PROFILE_COLOUR_BY_VALUE.get(hex.toLowerCase());
  if (option) return option.light;
  return deriveLighterCompanion(hex);
}

function mixHex(a: string, b: string, amount: number): string {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex(ar.r + (br.r - ar.r) * t, ar.g + (br.g - ar.g) * t, ar.b + (br.b - ar.b) * t);
}

/**
 * Distinct same-hue shades for multi-slice charts (top sales donut, etc.).
 * Index 0 is closest to the base; later indices step lighter then darker.
 */
export function accentShadeRamp(base: string, count: number): string[] {
  if (count <= 0) return [];
  const resolved = resolveProfileColour(base) ?? NEUTRAL_HUB_ACCENT;
  const light = lighterCompanionFor(resolved);
  const { r, g, b } = hexToRgb(resolved);
  const { h, s, l } = rgbToHsl(r, g, b);

  if (count === 1) return [resolved];

  const shades: string[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i === 0) {
      shades.push(resolved);
      continue;
    }
    const t = i / (count - 1);
    if (t <= 0.55) {
      const mix = t / 0.55;
      shades.push(mixHex(resolved, light, 0.25 + mix * 0.55));
    } else {
      const darkT = (t - 0.55) / 0.45;
      const darkened = Math.max(0.08, l * (1 - 0.18 - darkT * 0.35));
      const rgb = hslToRgb(h, Math.min(1, s * 1.05), darkened);
      shades.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  }
  return shades;
}

/** Soft muted fill for secondary chart bars (same hue, low intensity). */
export function accentMutedFor(hex: string): string {
  const resolved = resolveProfileColour(hex) ?? NEUTRAL_HUB_ACCENT;
  return mixHex(resolved, "#ebebeb", 0.72);
}

export function isAllowedProfileColour(value: string | null | undefined): value is string {
  if (!value || !HEX_COLOUR_PATTERN.test(value)) return false;
  return PROFILE_COLOUR_BY_VALUE.has(value.toLowerCase());
}

/**
 * Resolve a stored profile colour. Returns `null` when unset/invalid so the hub
 * can keep neutral black/white buttons instead of forcing a brand colour.
 */
export function resolveProfileColour(value: string | null | undefined): string | null {
  if (isAllowedProfileColour(value)) return value.toLowerCase();
  return null;
}
