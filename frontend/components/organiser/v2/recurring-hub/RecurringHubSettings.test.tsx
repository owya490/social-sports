import { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventHubPreferenceRow, EventHubSettingTile } from "../event-hub/EventHubStage";
import { RecurringHubSettings } from "./RecurringHubSettings";

let mockStripeReady = true;
const mockSaveSettings = jest.fn();

jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({ user: { stripeAccountActive: mockStripeReady } }),
}));

jest.mock("@/services/src/waitlist/waitlistService", () => ({ WAITLIST_ENABLED: false }));

jest.mock("@/components/organiser/v2/settings/SportshubStripeIntegrationIcon", () => ({
  SportshubStripeIntegrationIcon: () => null,
}));

jest.mock("../event-hub/EventHubStage", () => {
  const actual = jest.requireActual("../event-hub/EventHubStage");
  return {
    ...actual,
    EventHubPreferenceRow: jest.fn(actual.EventHubPreferenceRow),
    EventHubSettingTile: jest.fn(actual.EventHubSettingTile),
  };
});

const preferenceRow = jest.mocked(EventHubPreferenceRow);
const settingTile = jest.mocked(EventHubSettingTile);

describe("RecurringHubSettings booking control", () => {
  const props: ComponentProps<typeof RecurringHubSettings> = {
    loading: false,
    paused: false,
    saveSettings: mockSaveSettings,
    isSaving: false,
    seriesStatus: "active",
    onManageSchedule: jest.fn(),
    paymentsActive: true,
    stripeFeeToCustomer: true,
    promotionalCodesEnabled: false,
    hideVacancy: false,
    waitlistEnabled: false,
    bookingApprovalEnabled: false,
    showAttendeesOnEventPage: false,
    maxTicketsPerTransaction: 1,
    eventCapacity: 24,
    eventPrice: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeReady = true;
  });

  function renderBookingTile(overrides: Partial<typeof props> = {}) {
    renderToStaticMarkup(<RecurringHubSettings {...props} {...overrides} />);
    return settingTile.mock.calls.find(([tile]) => tile.title === "Bookings on new events")![0];
  }

  it("does not show editable defaults before the template loads", () => {
    const markup = renderToStaticMarkup(<RecurringHubSettings {...props} loading />);

    expect(markup).not.toContain('role="switch"');
    expect(preferenceRow).not.toHaveBeenCalled();
    expect(settingTile).not.toHaveBeenCalled();
  });

  it.each([false, true])("requests the inverse booking switch state when paused=%s", (paused) => {
    const tile = renderBookingTile({ paused });
    expect(tile.checked).toBe(!paused);

    tile.onChange(paused);
    expect(mockSaveSettings).toHaveBeenCalledWith({ kind: "boolean", key: "paused", value: !paused });
  });

  it.each([0, 1500])("keeps booking availability independent of Stripe for price=%i", (eventPrice) => {
    mockStripeReady = false;
    const tile = renderBookingTile({ eventPrice });
    const checkout = settingTile.mock.calls.find(([setting]) => setting.title === (eventPrice === 0 ? "Accept bookings" : "Accept payments"))![0];

    expect(tile.disabled).toBe(false);
    expect(checkout.disabled).toBe(true);
    expect(checkout.title).toBe(eventPrice === 0 ? "Accept bookings" : "Accept payments");
  });

  it("explains the inactive-series lock and offers schedule recovery", () => {
    const markup = renderToStaticMarkup(<RecurringHubSettings {...props} seriesStatus="inactive" />);
    const tile = settingTile.mock.calls.find(([setting]) => setting.title === "Bookings on new events")![0];

    expect(tile.locked).toBe(true);
    expect(markup).toContain("Locked");
    expect(markup).toContain("Series inactive.");
    expect(markup).toContain("Extend schedule");
    expect(markup).toContain(`aria-describedby="${tile.descriptionId}"`);
    expect(markup).toContain(`id="${tile.descriptionId}"`);

    jest.clearAllMocks();
    const activeTile = renderBookingTile({ seriesStatus: "active" });
    expect(activeTile.disabled).toBe(false);
    expect(activeTile.locked).toBe(false);
    const activeMarkup = renderToStaticMarkup(<RecurringHubSettings {...props} />);
    expect(activeMarkup).not.toContain("Extend schedule");
    expect(activeMarkup).not.toContain("Locked");
    expect(activeMarkup).toContain("Pausing bookings does not stop event creation.");
  });

  it("locks bookings with reload recovery when the series status cannot be confirmed", () => {
    const markup = renderToStaticMarkup(<RecurringHubSettings {...props} seriesStatus="unavailable" />);
    const tile = settingTile.mock.calls.find(([setting]) => setting.title === "Bookings on new events")![0];

    expect(tile.locked).toBe(true);
    expect(markup).toContain("Status unavailable.");
    expect(markup).toContain("Reload page");
    expect(markup).not.toContain("Series inactive.");
    expect(markup).not.toContain("Extend schedule");
  });

  it("blocks further changes while a settings save is in flight", () => {
    expect(renderBookingTile({ isSaving: true }).disabled).toBe(true);
    expect(settingTile.mock.calls.every(([tile]) => tile.disabled)).toBe(true);
  });
});
