import { Environment, getEnvironment } from "../../utilities/environment";

jest.mock("@next/third-parties/google", () => ({
  sendGAEvent: jest.fn(),
}));

jest.mock("../../utilities/environment", () => ({
  Environment: {
    DEVELOPMENT: "DEVELOPMENT",
    PREVIEW: "PREVIEW",
    PRODUCTION: "PRODUCTION",
  },
  getEnvironment: jest.fn(),
}));

import { sendGAEvent } from "@next/third-parties/google";
import { AnalyticsEvent, trackEvent, trackScreen } from "../src/analytics/analyticsService";

const mockedSendGAEvent = sendGAEvent as jest.Mock;
const mockedGetEnvironment = getEnvironment as jest.Mock;

const testWindow = {
  dataLayer: [] as unknown[],
  setTimeout: (handler: () => void) => {
    handler();
    return 0;
  },
};

Object.defineProperty(global, "window", {
  configurable: true,
  writable: true,
  value: testWindow,
});

describe("trackEvent", () => {
  beforeEach(() => {
    mockedSendGAEvent.mockReset();
    mockedGetEnvironment.mockReset();
    testWindow.dataLayer = [];
  });

  it("sends a sanitized event in production", async () => {
    mockedGetEnvironment.mockReturnValue(Environment.PRODUCTION);

    trackEvent(AnalyticsEvent.ORGANISER_EVENT_CREATE, {
      sport: "  volleyball  ",
      is_paid: true,
      price: 1500,
      ignored: undefined,
      empty: "   ",
      bad: Number.NaN,
    });

    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });

    expect(mockedSendGAEvent).toHaveBeenCalledWith("event", "organiser_event_create", {
      sport: "volleyball",
      is_paid: true,
      price: 1500,
    });
  });

  it("does not send events outside production", async () => {
    mockedGetEnvironment.mockReturnValue(Environment.DEVELOPMENT);

    trackEvent(AnalyticsEvent.SCREEN_VIEW, { page_template: "/" });
    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });

    expect(mockedSendGAEvent).not.toHaveBeenCalled();
  });

  it("does not throw when sending fails or the environment lookup fails", async () => {
    mockedGetEnvironment.mockReturnValue(Environment.PRODUCTION);
    mockedSendGAEvent.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => trackEvent(AnalyticsEvent.ORGANISER_EVENT_DELETE, { event_id: "evt" })).not.toThrow();
    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });

    mockedGetEnvironment.mockImplementation(() => {
      throw new Error("missing env");
    });
    expect(() => trackScreen("/login", "/login", "account")).not.toThrow();
  });
});
