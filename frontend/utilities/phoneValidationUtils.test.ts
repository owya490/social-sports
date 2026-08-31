import { validatePhoneNumber } from "./phoneValidationUtils";

describe("validatePhoneNumber", () => {
  it("rejects empty and non-digit values", () => {
    expect(validatePhoneNumber("")).toBe(false);
    expect(validatePhoneNumber("   ")).toBe(false);
    expect(validatePhoneNumber("abcdefgh")).toBe(false);
  });

  it("rejects 8 digits or fewer", () => {
    expect(validatePhoneNumber("12345678")).toBe(false);
    expect(validatePhoneNumber("04123467")).toBe(false);
  });

  it("accepts more than 8 digits", () => {
    expect(validatePhoneNumber("123456789")).toBe(true);
    expect(validatePhoneNumber("0412345678")).toBe(true);
  });

  it("counts digits in formatted numbers", () => {
    expect(validatePhoneNumber("0412 345 678")).toBe(true);
    expect(validatePhoneNumber("+61 412 345 678")).toBe(true);
    expect(validatePhoneNumber("0412-345")).toBe(false);
  });
});
