import {
  accentContrastFor,
  DEFAULT_PROFILE_COLOUR,
  isAllowedProfileColour,
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
});
