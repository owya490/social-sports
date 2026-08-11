import {
  accentContrastFor,
  darkerCompanionFor,
  DEFAULT_PROFILE_COLOUR,
  isAllowedProfileColour,
  relativeLuminance,
  resolveProfileColour,
} from "../src/users/profileColour";

describe("profileColour", () => {
  it("defaults missing or invalid colours to sports yellow", () => {
    expect(resolveProfileColour(undefined)).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("")).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("#ffffff")).toBe(DEFAULT_PROFILE_COLOUR);
    expect(resolveProfileColour("not-a-colour")).toBe(DEFAULT_PROFILE_COLOUR);
  });

  it("accepts palette colours case-insensitively", () => {
    expect(isAllowedProfileColour("#2563EB")).toBe(true);
    expect(resolveProfileColour("#2563EB")).toBe("#2563eb");
  });

  it("picks black contrast for light accents and white for dark accents", () => {
    expect(accentContrastFor("#f2b705")).toBe("#0a0a0a");
    expect(accentContrastFor("#2563eb")).toBe("#ffffff");
  });

  it("derives a darker companion shade for selection rings", () => {
    const companion = darkerCompanionFor("#f2b705");
    expect(companion).toMatch(/^#[0-9a-f]{6}$/);
    expect(relativeLuminance(companion)).toBeLessThan(relativeLuminance("#f2b705"));
    expect(darkerCompanionFor("#2563eb")).not.toBe("#2563eb");
  });

  it("uses a distinctly bolder companion than the accent fill", () => {
    // Sports yellow should not resolve to near-black; still same-hue darker.
    const companion = darkerCompanionFor(DEFAULT_PROFILE_COLOUR);
    expect(relativeLuminance(companion)).toBeGreaterThan(0.05);
    expect(relativeLuminance(companion)).toBeLessThan(relativeLuminance(DEFAULT_PROFILE_COLOUR) * 0.85);
  });
});
