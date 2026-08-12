import {
  accentShadeRamp,
  isAllowedProfileColour,
  lighterCompanionFor,
  NEUTRAL_HUB_ACCENT,
  PROFILE_COLOUR_OPTIONS,
  relativeLuminance,
  resolveProfileColour,
  UNSET_PROFILE_COLOUR,
} from "../src/users/profileColour";

describe("profileColour", () => {
  it("treats missing or invalid colours as unset (no forced brand colour)", () => {
    expect(resolveProfileColour(undefined)).toBeNull();
    expect(resolveProfileColour("")).toBeNull();
    expect(resolveProfileColour(UNSET_PROFILE_COLOUR)).toBeNull();
    expect(resolveProfileColour("#ffffff")).toBeNull();
    expect(resolveProfileColour("not-a-colour")).toBeNull();
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
    expect(isAllowedProfileColour("#1D4ED8")).toBe(true);
    expect(resolveProfileColour("#1D4ED8")).toBe("#1d4ed8");
    expect(resolveProfileColour("#F2B705")).toBe("#f2b705");
  });

  it("pairs fills with readable companions", () => {
    expect(lighterCompanionFor("#1d4ed8")).toBe("#bfdbfe");
    expect(lighterCompanionFor("#f2b705")).toBe("#0a0a0a");
    expect(lighterCompanionFor("#0a0a0a")).toBe("#f5f5f5");
    expect(relativeLuminance(lighterCompanionFor("#c41e3a"))).toBeGreaterThan(
      relativeLuminance("#c41e3a"),
    );
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
