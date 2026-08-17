import { hasHashTarget, resetWindowScroll } from "./scrollToTopOnNavigation";

describe("hasHashTarget", () => {
  it("is false when the URL has no fragment", () => {
    expect(hasHashTarget("")).toBe(false);
  });

  it("is false for a bare hash with no target", () => {
    expect(hasHashTarget("#")).toBe(false);
  });

  it("is true when the URL targets an in-page fragment", () => {
    expect(hasHashTarget("#tickets")).toBe(true);
  });
});

describe("resetWindowScroll", () => {
  it("scrolls to the origin", () => {
    const scrollTo = jest.fn();
    resetWindowScroll(scrollTo);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
