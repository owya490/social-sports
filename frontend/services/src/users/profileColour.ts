/**
 * Unset profile colour — Organiser Hub stays black/white until the user picks one.
 * EmptyPublicUserData uses this so unset users do not inherit a brand yellow flash.
 *
 * Stored values are `#rrggbb` hex strings so custom colours can be added later.
 */
export const UNSET_PROFILE_COLOUR = "";

/** Neutral hub buttons while loading / when no profile colour is chosen. */
export const NEUTRAL_HUB_ACCENT = "#0a0a0a";
export const NEUTRAL_HUB_ACCENT_CONTRAST = "#ffffff";
export const NEUTRAL_HUB_ACCENT_SOFT = "#d4d4d4";

export type ProfileColourOption = {
  label: string;
  /** Strong fill used on primary buttons / hover accents (`#rrggbb`). */
  value: string;
  /** Soft/light accent for charts, chips, and non-button accents. */
  soft: string;
  /** Button label text on the accent fill. */
  onAccent: string;
};

/**
 * Curated organiser accents. Button text is white except yellow (black) and grey (light).
 */
export const PROFILE_COLOUR_OPTIONS: readonly ProfileColourOption[] = [
  { label: "Empire Red", value: "#c41e3a", soft: "#fecdd3", onAccent: "#ffffff" },
  { label: "Royal Blue", value: "#1d4ed8", soft: "#bfdbfe", onAccent: "#ffffff" },
  { label: "Sports Hub Yellow", value: "#f2b705", soft: "#fef08c", onAccent: "#0a0a0a" },
  { label: "Forest Green", value: "#166534", soft: "#bbf7d0", onAccent: "#ffffff" },
  { label: "Purple", value: "#7e22ce", soft: "#e9d5ff", onAccent: "#ffffff" },
  { label: "Grey", value: "#6b7280", soft: "#e5e7eb", onAccent: "#f3f4f6" },
  { label: "Black", value: "#0a0a0a", soft: "#d4d4d4", onAccent: "#ffffff" },
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

function mixHex(a: string, b: string, amount: number): string {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex(ar.r + (br.r - ar.r) * t, ar.g + (br.g - ar.g) * t, ar.b + (br.b - ar.b) * t);
}

function deriveSoftAccent(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.2) return "#d4d4d4";
  const lightL = Math.min(0.92, Math.max(0.78, l + 0.45));
  const softS = Math.min(0.55, s * 0.55);
  const rgb = hslToRgb(h, softS, lightL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function deriveButtonContrast(hex: string): string {
  // Light fills (yellow-like) keep dark text; mid greys keep a light companion; else white.
  const luminance = relativeLuminance(hex);
  if (luminance > 0.55) return "#0a0a0a";
  const { r, g, b } = hexToRgb(hex);
  const { s } = rgbToHsl(r, g, b);
  if (s < 0.12 && luminance > 0.2) return "#f3f4f6";
  return "#ffffff";
}

/** Soft/light accent for charts and non-button accents (curated when available). */
export function softAccentFor(hex: string): string {
  const option = PROFILE_COLOUR_BY_VALUE.get(hex.toLowerCase());
  if (option) return option.soft;
  return deriveSoftAccent(hex);
}

/** @deprecated Prefer softAccentFor — kept for call-site compatibility. */
export function lighterCompanionFor(hex: string): string {
  return softAccentFor(hex);
}

/** Button label colour on the accent fill (white except yellow / grey). */
export function buttonContrastFor(hex: string): string {
  const option = PROFILE_COLOUR_BY_VALUE.get(hex.toLowerCase());
  if (option) return option.onAccent;
  return deriveButtonContrast(hex);
}

/**
 * Distinct same-hue shades for multi-slice charts (top sales donut, etc.).
 * Index 0 is closest to the base; later indices step toward soft then darker.
 */
export function accentShadeRamp(base: string, count: number): string[] {
  if (count <= 0) return [];
  const resolved = resolveProfileColour(base) ?? NEUTRAL_HUB_ACCENT;
  const soft = softAccentFor(resolved);
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
      shades.push(mixHex(resolved, soft, 0.25 + mix * 0.55));
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

/** True for any `#rrggbb` hex (palette or future custom colours). */
export function isValidProfileColourHex(value: string | null | undefined): value is string {
  return Boolean(value && HEX_COLOUR_PATTERN.test(value));
}

/** True when the value is one of the curated selector swatches. */
export function isPaletteProfileColour(value: string | null | undefined): value is string {
  if (!isValidProfileColourHex(value)) return false;
  return PROFILE_COLOUR_BY_VALUE.has(value.toLowerCase());
}

/** @deprecated Prefer isPaletteProfileColour / isValidProfileColourHex. */
export function isAllowedProfileColour(value: string | null | undefined): value is string {
  return isPaletteProfileColour(value);
}

/**
 * Resolve a stored profile colour hex. Returns `null` when unset/invalid so the hub
 * can keep neutral black/white buttons. Accepts any `#rrggbb` for future custom colours.
 */
export function resolveProfileColour(value: string | null | undefined): string | null {
  if (!isValidProfileColourHex(value)) return null;
  return value.toLowerCase();
}
