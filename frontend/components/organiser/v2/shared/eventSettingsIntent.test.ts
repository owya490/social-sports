import { EventBooleanSettingKey, getEventSettingsIntentBlockReason } from "./eventSettingsIntent";

jest.mock("@/services/src/waitlist/waitlistService", () => ({ WAITLIST_ENABLED: false }));

const current = { stripeAccountActive: true, eventPrice: 1000, eventCapacity: 8 };

describe("getEventSettingsIntentBlockReason", () => {
  it.each<EventBooleanSettingKey>(["paymentsActive", "bookingApprovalEnabled", "stripeFeeToCustomer", "promotionalCodesEnabled"])(
    "requires current Stripe readiness for %s in either direction",
    (key) => {
      for (const value of [true, false]) {
        expect(getEventSettingsIntentBlockReason({ kind: "boolean", key, value }, { ...current, stripeAccountActive: false })).toContain("Connect Stripe");
        expect(getEventSettingsIntentBlockReason({ kind: "boolean", key, value }, current)).toBeNull();
      }
    }
  );

  it.each<EventBooleanSettingKey>(["stripeFeeToCustomer", "promotionalCodesEnabled"])("requires a paid event for %s", (key) => {
    expect(getEventSettingsIntentBlockReason({ kind: "boolean", key, value: true }, { ...current, eventPrice: 0, stripeAccountActive: false })).toContain("paid events");
  });

  it("keeps free-event bookings and approval available when Stripe is ready", () => {
    const free = { ...current, eventPrice: 0 };
    expect(getEventSettingsIntentBlockReason({ kind: "boolean", key: "paymentsActive", value: true }, free)).toBeNull();
    expect(getEventSettingsIntentBlockReason({ kind: "boolean", key: "bookingApprovalEnabled", value: true }, free)).toBeNull();
  });

  it("blocks omitted waitlist controls using the canonical feature flag", () => {
    expect(getEventSettingsIntentBlockReason({ kind: "boolean", key: "waitlistEnabled", value: false }, current)).toContain("not available");
  });

  it.each<EventBooleanSettingKey>(["paused", "hideVacancy", "showAttendeesOnEventPage"])("does not add Stripe or activity restrictions to %s", (key) => {
    expect(getEventSettingsIntentBlockReason({ kind: "boolean", key, value: true }, { ...current, stripeAccountActive: undefined })).toBeNull();
  });

  it("leaves the distinct header pause activity rule to its owner", () => {
    expect(getEventSettingsIntentBlockReason({ kind: "headerPause", value: true }, current)).toBeNull();
  });

  it.each([0, -1, 1.5, 9, NaN, Infinity])("rejects invalid desired ticket count %s without clamping", (value) => {
    expect(getEventSettingsIntentBlockReason({ kind: "maxTickets", value }, current)).toContain("1 to 8");
  });

  it("uses current capacity and the canonical organiser cap", () => {
    expect(getEventSettingsIntentBlockReason({ kind: "maxTickets", value: 8 }, current)).toBeNull();
    expect(getEventSettingsIntentBlockReason({ kind: "maxTickets", value: 8 }, { ...current, eventCapacity: 3 })).toContain("1 to 3");
    expect(getEventSettingsIntentBlockReason({ kind: "maxTickets", value: 11 }, { ...current, eventCapacity: 100 })).toContain("1 to 10");
    expect(getEventSettingsIntentBlockReason({ kind: "maxTickets", value: 1 }, { ...current, eventCapacity: 0 })).toBeNull();
  });
});
