import {
  isValidUsername,
  sanitizeUsernameInput,
} from "./usernameValidationUtils";

describe("sanitizeUsernameInput", () => {
  it("lowercases and removes spaces", () => {
    expect(sanitizeUsernameInput("John Doe")).toBe("johndoe");
  });

  it("strips invalid characters", () => {
    expect(sanitizeUsernameInput("john@doe!")).toBe("johndoe");
  });

  it("keeps allowed characters", () => {
    expect(sanitizeUsernameInput("friday-tennis-42")).toBe("friday-tennis-42");
    expect(sanitizeUsernameInput("tennis_club")).toBe("tennis_club");
  });
});

describe("isValidUsername", () => {
  it("rejects empty and invalid usernames", () => {
    expect(isValidUsername("")).toBe(false);
    expect(isValidUsername("john doe")).toBe(false);
    expect(isValidUsername("john@doe")).toBe(false);
  });

  it("accepts lowercase letters, numbers, hyphens, and underscores", () => {
    expect(isValidUsername("johndoe")).toBe(true);
    expect(isValidUsername("friday-tennis-42")).toBe(true);
    expect(isValidUsername("john_smith")).toBe(true);
  });
});
