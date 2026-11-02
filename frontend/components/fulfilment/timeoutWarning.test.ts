import { shouldResetTimeoutWarningDismissal, shouldShowTimeoutWarning } from "./timeoutWarning";

describe("timeout warning dismissal", () => {
  it("opens during the last 30 seconds until the buyer confirms", () => {
    expect(shouldShowTimeoutWarning(30 * 1000, false)).toBe(true);
    expect(shouldShowTimeoutWarning(1, false)).toBe(true);
  });

  it("stays closed after confirm while time is still remaining", () => {
    expect(shouldShowTimeoutWarning(20 * 1000, true)).toBe(false);
    expect(shouldShowTimeoutWarning(1, true)).toBe(false);
  });

  it("stays closed outside the warning window", () => {
    expect(shouldShowTimeoutWarning(null, false)).toBe(false);
    expect(shouldShowTimeoutWarning(0, false)).toBe(false);
    expect(shouldShowTimeoutWarning(30 * 1000 + 1, false)).toBe(false);
  });

  it("allows the warning again only after the session is no longer inside the final 30 seconds", () => {
    expect(shouldResetTimeoutWarningDismissal(30 * 1000)).toBe(false);
    expect(shouldResetTimeoutWarningDismissal(1)).toBe(false);
    expect(shouldResetTimeoutWarningDismissal(0)).toBe(false);
    expect(shouldResetTimeoutWarningDismissal(null)).toBe(false);
    expect(shouldResetTimeoutWarningDismissal(30 * 1000 + 1)).toBe(true);
  });

  it("does not reopen on the next countdown tick after confirm", () => {
    let dismissed = false;

    expect(shouldShowTimeoutWarning(20 * 1000, dismissed)).toBe(true);

    dismissed = true;

    expect(shouldShowTimeoutWarning(19 * 1000, dismissed)).toBe(false);
    expect(shouldShowTimeoutWarning(1 * 1000, dismissed)).toBe(false);

    if (shouldResetTimeoutWarningDismissal(31 * 1000)) {
      dismissed = false;
    }

    expect(dismissed).toBe(false);
    expect(shouldShowTimeoutWarning(20 * 1000, dismissed)).toBe(true);
  });
});
