import {
  getOrganiserV2EntryHref,
  hasWelcomeBeenSeen,
  markWelcomeSeen,
  WELCOME_SEEN_KEY,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { isOrganiserHubV2BannerEnabled } from "@/services/featureFlags";

describe("organiser hub v2 banner allowlist", () => {
  it("enables the banner for the pilot organisers", () => {
    expect(isOrganiserHubV2BannerEnabled("98PJNSoCmNU5zslxa1wIdZ3mPdf2")).toBe(true);
    expect(isOrganiserHubV2BannerEnabled("ZzuRS5v8hhWonnp2qdIOZG8R7f12")).toBe(true);
  });

  it("hides the banner for other users", () => {
    expect(isOrganiserHubV2BannerEnabled("")).toBe(false);
    expect(isOrganiserHubV2BannerEnabled("someone-else")).toBe(false);
  });
});

describe("organiser v2 welcome entry href", () => {
  beforeEach(() => {
    window.localStorage.removeItem(WELCOME_SEEN_KEY);
  });

  it("sends first-time visitors to the welcome tour", () => {
    expect(hasWelcomeBeenSeen()).toBe(false);
    expect(getOrganiserV2EntryHref()).toBe("/organiser/v2/welcome");
  });

  it("sends returning visitors straight to the dashboard after welcome is marked seen", () => {
    markWelcomeSeen();
    expect(hasWelcomeBeenSeen()).toBe(true);
    expect(getOrganiserV2EntryHref()).toBe("/organiser/v2/dashboard");
  });
});
