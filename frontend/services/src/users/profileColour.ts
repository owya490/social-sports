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

export function isAllowedProfileColour(value: string | null | undefined): value is string {
  if (!value || !HEX_COLOUR_PATTERN.test(value)) return false;
  return PROFILE_COLOUR_VALUES.has(value.toLowerCase());
}

/** Resolve a stored profile colour to a safe accent hex (defaults to sports yellow). */
export function resolveProfileColour(value: string | null | undefined): string {
  if (isAllowedProfileColour(value)) return value.toLowerCase();
  return DEFAULT_PROFILE_COLOUR;
}
