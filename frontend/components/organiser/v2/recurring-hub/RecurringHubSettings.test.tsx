import { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventHubPreferenceRow, EventHubSettingTile } from "../event-hub/EventHubStage";
import { runOptimisticSave, SettingsAutosaveOperation } from "../event-hub/useSettingsAutosave";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { updateRecurrenceTemplateEventData } from "@/services/src/recurringEvents/recurringEventsService";
import { RecurringHubSettings } from "./RecurringHubSettings";

let mockStripeReady = true;
let mockIsSaving = false;
const mockRun = jest.fn<Promise<void>, [SettingsAutosaveOperation]>();

jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({ user: { stripeAccountActive: mockStripeReady } }),
}));

jest.mock("@/services/src/recurringEvents/recurringEventsService", () => ({
  updateRecurrenceTemplateEventData: jest.fn(),
}));

jest.mock("@/services/src/waitlist/waitlistService", () => ({ WAITLIST_ENABLED: false }));

jest.mock("@/components/organiser/v2/settings/SportshubStripeIntegrationIcon", () => ({
  SportshubStripeIntegrationIcon: () => null,
}));

jest.mock("../event-hub/useSettingsAutosave", () => ({
  ...jest.requireActual("../event-hub/useSettingsAutosave"),
  useSettingsAutosave: () => ({
    status: mockIsSaving ? "saving" : "idle",
    isSaving: mockIsSaving,
    run: mockRun,
    retry: jest.fn(),
  }),
}));

jest.mock("../event-hub/EventHubStage", () => {
  const actual = jest.requireActual("../event-hub/EventHubStage");
  return {
    ...actual,
    EventHubPreferenceRow: jest.fn(actual.EventHubPreferenceRow),
    EventHubSettingTile: jest.fn(actual.EventHubSettingTile),
  };
});

const updateTemplate = jest.mocked(updateRecurrenceTemplateEventData);
const preferenceRow = jest.mocked(EventHubPreferenceRow);
const settingTile = jest.mocked(EventHubSettingTile);

describe("RecurringHubSettings booking control", () => {
  const props: ComponentProps<typeof RecurringHubSettings> = {
    loading: false,
    recurrenceTemplateId: "template-1" as RecurrenceTemplateId,
    paused: false,
    setPaused: jest.fn(),
    seriesStatus: "active",
    onManageSchedule: jest.fn(),
    paymentsActive: true,
    setPaymentsActive: jest.fn(),
    stripeFeeToCustomer: true,
    setStripeFeeToCustomer: jest.fn(),
    promotionalCodesEnabled: false,
    setPromotionalCodesEnabled: jest.fn(),
    hideVacancy: false,
    setHideVacancy: jest.fn(),
    waitlistEnabled: false,
    setWaitlistEnabled: jest.fn(),
    bookingApprovalEnabled: false,
    setBookingApprovalEnabled: jest.fn(),
    showAttendeesOnEventPage: false,
    setShowAttendeesOnEventPage: jest.fn(),
    maxTicketsPerTransaction: 1,
    setMaxTicketsPerTransaction: jest.fn(),
    eventCapacity: 24,
    eventPrice: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeReady = true;
    mockIsSaving = false;
    mockRun.mockResolvedValue(undefined);
    updateTemplate.mockResolvedValue(true);
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

  it.each([false, true])("persists the inverse booking switch state when paused=%s", async (paused) => {
    const tile = renderBookingTile({ paused });
    expect(tile.checked).toBe(!paused);

    tile.onChange(paused);
    const [operation] = mockRun.mock.calls[0];
    await expect(runOptimisticSave(operation)).resolves.toBe(true);

    expect(updateTemplate).toHaveBeenCalledWith("template-1", { paused: !paused });
    expect(props.setPaused).toHaveBeenCalledWith(!paused);
    expect(props.setPaymentsActive).not.toHaveBeenCalled();
  });

  it("rolls back a rejected booking update and can retry the same operation", async () => {
    updateTemplate.mockRejectedValueOnce(new Error("write failed"));
    renderBookingTile().onChange(false);
    const [operation] = mockRun.mock.calls[0];

    await expect(runOptimisticSave(operation)).resolves.toBe(false);
    expect(props.setPaused).toHaveBeenNthCalledWith(1, true);
    expect(props.setPaused).toHaveBeenNthCalledWith(2, false);

    await expect(runOptimisticSave(operation)).resolves.toBe(true);
    expect(props.setPaused).toHaveBeenLastCalledWith(true);
    expect(updateTemplate).toHaveBeenNthCalledWith(2, "template-1", { paused: true });
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
    mockIsSaving = true;
    expect(renderBookingTile().disabled).toBe(true);
    expect(settingTile.mock.calls.every(([tile]) => tile.disabled)).toBe(true);
  });
});
