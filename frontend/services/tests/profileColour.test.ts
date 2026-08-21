import {
  accentShadeRamp,
  buttonContrastFor,
  isPaletteProfileColour,
  isValidProfileColourHex,
  NEUTRAL_HUB_ACCENT,
  PROFILE_COLOUR_OPTIONS,
  relativeLuminance,
  resolveProfileColour,
  softAccentFor,
  UNSET_PROFILE_COLOUR,
} from "../src/users/profileColour";

describe("profileColour", () => {
  it("treats missing or invalid colours as unset (no forced brand colour)", () => {
    expect(resolveProfileColour(undefined)).toBeNull();
    expect(resolveProfileColour("")).toBeNull();
    expect(resolveProfileColour(UNSET_PROFILE_COLOUR)).toBeNull();
    expect(resolveProfileColour("not-a-colour")).toBeNull();
    expect(resolveProfileColour("#fff")).toBeNull();
  });

  it("accepts any #rrggbb hex for future custom colouring", () => {
    expect(isValidProfileColourHex("#abcdef")).toBe(true);
    expect(resolveProfileColour("#ABCDEF")).toBe("#abcdef");
    expect(isPaletteProfileColour("#abcdef")).toBe(false);
  });

  it("exposes the curated organiser palette", () => {
    expect(PROFILE_COLOUR_OPTIONS.map((option) => option.label)).toEqual([
      "Empire Red",
      "Royal Blue",
      "Sports Hub Yellow",
      "Forest Green",
      "Purple",
      "Grey",
      "Black",
    ]);
    expect(PROFILE_COLOUR_OPTIONS).toHaveLength(7);
  });

  it("accepts palette colours case-insensitively", () => {
    expect(isPaletteProfileColour("#1D4ED8")).toBe(true);
    expect(resolveProfileColour("#1D4ED8")).toBe("#1d4ed8");
    expect(resolveProfileColour("#F2B705")).toBe("#f2b705");
  });

  it("uses white button text except yellow and grey", () => {
    expect(buttonContrastFor("#1d4ed8")).toBe("#ffffff");
    expect(buttonContrastFor("#c41e3a")).toBe("#ffffff");
    expect(buttonContrastFor("#166534")).toBe("#ffffff");
    expect(buttonContrastFor("#7e22ce")).toBe("#ffffff");
    expect(buttonContrastFor("#0a0a0a")).toBe("#ffffff");
    expect(buttonContrastFor("#f2b705")).toBe("#0a0a0a");
    expect(buttonContrastFor("#6b7280")).toBe("#f3f4f6");
  });

  it("keeps soft accents lighter than the base fill", () => {
    expect(softAccentFor("#1d4ed8")).toBe("#bfdbfe");
    expect(softAccentFor("#f2b705")).toBe("#fef08c");
    expect(relativeLuminance(softAccentFor("#c41e3a"))).toBeGreaterThan(relativeLuminance("#c41e3a"));
  });

  it("builds a same-hue shade ramp for charts", () => {
    const ramp = accentShadeRamp("#1d4ed8", 4);
    expect(ramp).toHaveLength(4);
    expect(ramp[0]).toBe("#1d4ed8");
    expect(new Set(ramp).size).toBe(4);
  });

  it("falls back to neutral black for unset shade ramps", () => {
    expect(accentShadeRamp("", 1)).toEqual([NEUTRAL_HUB_ACCENT]);
  });
});
