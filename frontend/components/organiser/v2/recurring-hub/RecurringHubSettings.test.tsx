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
    isActive: true,
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

  function renderBookingRow(overrides: Partial<typeof props> = {}) {
    renderToStaticMarkup(<RecurringHubSettings {...props} {...overrides} />);
    return preferenceRow.mock.calls.find(([row]) => row.title === "Bookings on new events")![0];
  }

  it("does not show editable defaults before the template loads", () => {
    const markup = renderToStaticMarkup(<RecurringHubSettings {...props} loading />);

    expect(markup).not.toContain('role="switch"');
    expect(preferenceRow).not.toHaveBeenCalled();
    expect(settingTile).not.toHaveBeenCalled();
  });

  it.each([false, true])("persists the inverse booking switch state when paused=%s", async (paused) => {
    const row = renderBookingRow({ paused });
    expect(row.checked).toBe(!paused);

    row.onChange(paused);
    const [operation] = mockRun.mock.calls[0];
    await expect(runOptimisticSave(operation)).resolves.toBe(true);

    expect(updateTemplate).toHaveBeenCalledWith("template-1", { paused: !paused });
    expect(props.setPaused).toHaveBeenCalledWith(!paused);
    expect(props.setPaymentsActive).not.toHaveBeenCalled();
  });

  it("rolls back a rejected booking update and can retry the same operation", async () => {
    updateTemplate.mockRejectedValueOnce(new Error("write failed"));
    renderBookingRow().onChange(false);
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
    const row = renderBookingRow({ eventPrice });
    const checkout = settingTile.mock.calls[0][0];

    expect(row.disabled).toBe(false);
    expect(checkout.disabled).toBe(true);
    expect(checkout.title).toBe(eventPrice === 0 ? "Accept bookings" : "Accept payments");
  });

  it("retains the inactive-series guard", () => {
    expect(renderBookingRow({ isActive: false }).disabled).toBe(true);
  });

  it("blocks further changes while a settings save is in flight", () => {
    mockIsSaving = true;
    expect(renderBookingRow().disabled).toBe(true);
    expect(settingTile.mock.calls.every(([tile]) => tile.disabled)).toBe(true);
  });
});
