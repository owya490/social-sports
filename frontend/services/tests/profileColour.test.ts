import {
  accentShadeRamp,
  DEFAULT_PROFILE_COLOUR,
  isAllowedProfileColour,
  lighterCompanionFor,
  PROFILE_COLOUR_OPTIONS,
  relativeLuminance,
  resolveProfileColour,
} from "../src/users/profileColour";

describe("profileColour", () => {
  it("defaults missing or invalid colours to the yellow rainbow option", () => {
    expect(resolveProfileColour(undefined)).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("")).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("#ffffff")).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("#f2b705")).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("not-a-colour")).toBe(DEFAULT_PROFILE_COLOUR);
  });

  it("exposes seven rainbow options with curated light companions", () => {
    expect(PROFILE_COLOUR_OPTIONS).toHaveLength(7);
    for (const option of PROFILE_COLOUR_OPTIONS) {
      expect(option.light).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(relativeLuminance(option.light)).toBeGreaterThan(relativeLuminance(option.value));
    }
  });

  it("accepts palette colours case-insensitively", () => {
    expect(isAllowedProfileColour("#1D4ED8")).toBe(true);
    expect(resolveProfileColour("#1D4ED8")).toBe("#1d4ed8");
  });

  it("uses a lighter companion for button text contrast", () => {
    const blue = "#1d4ed8";
    const light = lighterCompanionFor(blue);
    expect(light).toBe("#bfdbfe");
    expect(relativeLuminance(light)).toBeGreaterThan(relativeLuminance(blue));
  });

  it("builds a same-hue shade ramp for charts", () => {
    const ramp = accentShadeRamp("#1d4ed8", 4);
    expect(ramp).toHaveLength(4);
    expect(ramp[0]).toBe("#1d4ed8");
    expect(new Set(ramp).size).toBe(4);
  });
});
