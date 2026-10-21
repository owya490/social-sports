/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import RecurringPage from "@/app/(no-footer)/organiser/v2/event/recurring-events/[id]/page";
import { EmptyEventData, EmptyEventMetadata, EventData, EventFormAttachmentResult, EventId } from "@/interfaces/EventTypes";
import { EMPTY_RECURRENCE_TEMPLATE, RecurrenceTemplate, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { eventServiceLogger, getEventById, updateEventById, updateEventFormAttachment } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { EventSettingsIntent } from "../shared/eventSettingsIntent";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getRecurrenceTemplate, updateRecurrenceTemplateEventData, updateRecurrenceTemplateRecurrenceData } from "@/services/src/recurringEvents/recurringEventsService";
import { EventHubHeader } from "./EventHubHeader";
import { EventHubListing } from "./EventHubListing";
import { EventHubSettings } from "./EventHubSettings";
import { EventHubRegistration } from "./EventHubRegistration";
import { EventHubAttendees } from "./EventHubAttendees";
import { RecurringHubSettings } from "../recurring-hub/RecurringHubSettings";
import { RecurringHubRecurrence } from "../recurring-hub/RecurringHubRecurrence";
import { OrganiserEventHubView } from "./OrganiserEventHubView";

let mockId = "event-1";
let mockUser = { ...EmptyUserData, userId: "owner-1" as UserId, stripeAccountActive: true };
let mockUserLoading = false;
let mockAuthUserId: string | null = "owner-1";
const mockAuth = {
  get currentUser() { return mockAuthUserId === null ? null : { uid: mockAuthUserId }; },
};
const mockRouter = { push: jest.fn() };
let mockHeader: ComponentProps<typeof EventHubHeader>;
let mockListing: ComponentProps<typeof EventHubListing>;
let mockEventSettings: ComponentProps<typeof EventHubSettings>;
let mockRegistration: ComponentProps<typeof EventHubRegistration>;
let mockAttendees: ComponentProps<typeof EventHubAttendees>;
let mockRecurringSettings: ComponentProps<typeof RecurringHubSettings>;
let mockRecurrence: ComponentProps<typeof RecurringHubRecurrence>;

jest.mock("next/navigation", () => ({ useParams: () => ({ id: mockId }), useRouter: () => mockRouter }));
jest.mock("@/observability/logger", () => ({ Logger: class { error = jest.fn(); } }));
jest.mock("@/interfaces/EventTicketTypeTypes", () => ({
  ...jest.requireActual("@/interfaces/EventTicketTypeTypes"), createEmptyEventTicketTypes: () => ({}),
}));
jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({ user: mockUser, userLoading: mockUserLoading, auth: mockAuth }),
}));
jest.mock("@/services/src/events/eventsService", () => ({
  getEventById: jest.fn(), updateEventById: jest.fn(), updateEventFormAttachment: jest.fn(), eventServiceLogger: { error: jest.fn() },
  EventFormAttachmentTargetError: class EventFormAttachmentTargetError extends Error {},
}));
jest.mock("@/services/src/events/eventsMetadata/eventsMetadataService", () => ({
  getEventsMetadataByEventId: jest.fn(), subscribeToEventMetadata: jest.fn(() => jest.fn()),
}));
jest.mock("./registrationLiveUpdates", () => ({
  loadRegistrationData: jest.fn(async () => ({ allOrders: [], orderTicketsMap: new Map() })),
}));
jest.mock("@/services/src/events/eventsUtils/getEventsUtils", () => ({ bustEventsLocalStorageCache: jest.fn() }));
jest.mock("@/services/src/organiser/organiserEventsService", () => ({ bustOrganiserEventsCache: jest.fn() }));
jest.mock("@/services/src/tickets/ticketUtils/ticketUtils", () => ({ calculateNetSales: jest.fn() }));
jest.mock("@/services/src/recurringEvents/recurringEventsService", () => ({
  getRecurrenceTemplate: jest.fn(), updateRecurrenceTemplateEventData: jest.fn(),
  updateRecurrenceTemplateRecurrenceData: jest.fn(), calculateRecurrenceEnded: jest.fn(() => false),
}));
jest.mock("@/services/src/recurringEvents/recurringEventsUtils", () => ({
  extractNewRecurrenceFormDataFromRecurrenceData: ({ allRecurrences: _dates, pastRecurrences: _past, ...form }: RecurrenceTemplate["recurrenceData"]) => form,
}));
jest.mock("@/services/src/waitlist/waitlistService", () => ({ WAITLIST_ENABLED: false }));
jest.mock("@/components/organiser/v2/settings/ConnectStripeCta", () => ({ ConnectStripeCta: () => <span>Connect Stripe</span> }));
jest.mock("./EventHubHeader", () => ({ EventHubHeader: (props: ComponentProps<typeof EventHubHeader>) => {
  mockHeader = props;
  return <output data-testid="event-paused">{String(props.paused)}</output>;
} }));
jest.mock("./EventHubListing", () => ({ EventHubListing: (props: ComponentProps<typeof EventHubListing>) => {
  mockListing = props;
  return <output data-testid="listing">{props.eventName}:{String(props.commitBlocked)}</output>;
} }));
jest.mock("./EventHubSettings", () => ({ EventHubSettings: (props: ComponentProps<typeof EventHubSettings>) => {
  mockEventSettings = props;
  return <output data-testid="event-settings">{String(props.paused)}:{String(props.isSaving)}:{props.maxTicketsPerTransaction}</output>;
} }));
jest.mock("./EventHubAttendees", () => ({ EventHubAttendees: (props: ComponentProps<typeof EventHubAttendees>) => {
  mockAttendees = props;
  return null;
} }));
jest.mock("./EventHubRegistration", () => ({ EventHubRegistration: (props: ComponentProps<typeof EventHubRegistration>) => {
  mockRegistration = props;
  return <output data-testid="registration">Forms</output>;
} }));
jest.mock("./EventHubNav", () => ({ EventHubNav: ({ onChange }: { onChange: (section: string) => void }) => <>
  <button onClick={() => onChange("Settings")}>Settings tab</button><button onClick={() => onChange("Details")}>Details tab</button>
  <button onClick={() => onChange("Forms")}>Forms tab</button>
  <button onClick={() => onChange("Registrations")}>Registrations tab</button>
</> }));
jest.mock("../recurring-hub/RecurringHubNav", () => ({ RecurringHubNav: ({ onChange }: { onChange: (section: string) => void }) => <>
  <button onClick={() => onChange("Settings")}>Settings tab</button><button onClick={() => onChange("Details")}>Details tab</button><button onClick={() => onChange("Recurrence")}>Recurrence tab</button>
</> }));
jest.mock("../recurring-hub/RecurringHubHeader", () => ({ RecurringHubHeader: () => null }));
jest.mock("../recurring-hub/RecurringHubPastEvents", () => ({ RecurringHubPastEvents: () => null }));
jest.mock("../recurring-hub/RecurringHubSettings", () => ({ RecurringHubSettings: (props: ComponentProps<typeof RecurringHubSettings>) => {
  mockRecurringSettings = props;
  return <output data-testid="recurring-settings">{String(props.paused)}:{String(props.isSaving)}:{props.seriesStatus}</output>;
} }));
jest.mock("../recurring-hub/RecurringHubRecurrence", () => ({ RecurringHubRecurrence: (props: ComponentProps<typeof RecurringHubRecurrence>) => {
  mockRecurrence = props;
  return <output data-testid="schedule">{String(props.saveBlocked)}:{props.originalRecurrenceData?.recurrenceAmount}</output>;
} }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}

const event = (data: Partial<EventData> = {}): EventData => ({
  ...EmptyEventData, eventId: mockId as EventId, organiserId: mockUser.userId,
  name: "Current event", isActive: true, eventTicketTypes: undefined, capacity: 10, price: 1500,
  maxTicketsPerTransaction: 2, ...data,
});
const template = (data: Partial<EventData> = {}): RecurrenceTemplate => ({
  ...EMPTY_RECURRENCE_TEMPLATE, recurrenceTemplateId: mockId as RecurrenceTemplateId,
  eventData: event(data), recurrenceData: { ...EMPTY_RECURRENCE_TEMPLATE.recurrenceData, recurrenceEnabled: true },
});

async function openTab(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `${name} tab` }));
  await act(async () => { jest.advanceTimersByTime(120); });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockId = "event-1";
  mockUser = { ...EmptyUserData, userId: "owner-1" as UserId, stripeAccountActive: true };
  mockUserLoading = false;
  mockAuthUserId = "owner-1";
  jest.mocked(getEventById).mockReset().mockImplementation(async () => event());
  jest.mocked(getEventsMetadataByEventId).mockReset().mockResolvedValue(EmptyEventMetadata);
  jest.mocked(updateEventById).mockReset().mockResolvedValue(undefined);
  jest.mocked(bustEventsLocalStorageCache).mockReset();
  jest.mocked(bustOrganiserEventsCache).mockReset();
  jest.mocked(updateEventFormAttachment).mockReset();
  jest.mocked(getRecurrenceTemplate).mockReset().mockImplementation(async () => template());
  jest.mocked(updateRecurrenceTemplateEventData).mockReset().mockResolvedValue(true);
  jest.mocked(updateRecurrenceTemplateRecurrenceData).mockReset().mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());

it("stops unauthorized initial reads before loading registration metadata", async () => {
  jest.mocked(getEventById).mockResolvedValue(event({ organiserId: "other-owner" as UserId }));
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  expect(mockRouter.push).toHaveBeenCalledTimes(1);
  expect(getEventsMetadataByEventId).not.toHaveBeenCalled();
});

it("rejects an attendee refresh after live auth changes without applying its snapshot or starting another read", async () => {
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Registrations");
  const staleRead = deferred<EventData>();
  jest.mocked(getEventById).mockReturnValueOnce(staleRead.promise);
  const refresh = mockAttendees.onEventRefresh!;
  let pending!: Promise<void>;
  act(() => { pending = refresh(); });
  mockAuthUserId = "other-auth";
  await act(async () => {
    staleRead.resolve(event({ capacity: 99 }));
    await expect(pending).rejects.toThrow("could not be refreshed for this account");
  });
  expect(mockAttendees.eventData.capacity).toBe(10);
  await expect(refresh()).rejects.toThrow("could not be refreshed for this account");
  expect(getEventById).toHaveBeenCalledTimes(2);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

it("owns attachment persistence across tabs and preserves newer names and inventory without reconciling another event", async () => {
  const typeId = "general" as EventTicketTypeId;
  const siblingId = "sibling" as EventTicketTypeId;
  const types = {
    [typeId]: { id: typeId, name: "General Admission", price: 1500, capacity: 10, vacancy: 4, formId: null },
    [siblingId]: { id: siblingId, name: "VIP", price: 2000, capacity: 5, vacancy: 2, formId: null },
  };
  jest.mocked(getEventById).mockImplementation(async () => event({ eventTicketTypes: types }));
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Forms");
  const pending = deferred<EventFormAttachmentResult>();
  jest.mocked(updateEventFormAttachment).mockReturnValueOnce(pending.promise);
  const save = mockRegistration.attachment.save;
  const result: EventFormAttachmentResult = {
    eventId: "event-1" as EventId,
    target: { kind: "ticketType", eventTicketTypeId: typeId, ticketTypeName: "Renamed" },
    formId: null,
    eventFormIdUpdated: false,
  };
  act(() => { void save({ eventId: result.eventId, target: { kind: "ticketType", eventTicketTypeId: typeId }, formId: null }); });
  await openTab("Details");
  act(() => mockListing.setEventTicketTypes!({ ...types,
    [typeId]: { ...types[typeId], name: "Newer name", vacancy: 1 }, [siblingId]: { ...types[siblingId], price: 2500 },
  }));
  const currentTypes = mockListing.eventTicketTypes!;
  const inventory = { capacity: mockListing.eventCapacity, vacancy: mockListing.eventVacancy };
  await act(async () => { pending.resolve(result); });
  expect(mockListing.eventTicketTypes?.[typeId]).toEqual(currentTypes[typeId]);
  expect(mockListing.eventTicketTypes?.[siblingId]).toBe(currentTypes[siblingId]);
  expect(mockListing.eventCapacity).toBe(inventory.capacity);
  expect(mockListing.eventVacancy).toBe(inventory.vacancy);
  await openTab("Forms");
  expect(mockRegistration.attachment.savedResult).toEqual(result);
  expect(getEventById).toHaveBeenCalledTimes(1);

  const oldRequest = deferred<EventFormAttachmentResult>();
  jest.mocked(updateEventFormAttachment).mockReturnValueOnce(oldRequest.promise);
  act(() => { void save({ eventId: result.eventId, target: { kind: "ticketType", eventTicketTypeId: typeId }, formId: null }); });

  mockId = "event-2";
  view.rerender(<OrganiserEventHubView />);
  await act(async () => undefined);
  await act(async () => { oldRequest.resolve(result); });
  expect(mockListing.eventId).toBe("event-2");
  expect(mockListing.eventTicketTypes?.[typeId]).toEqual(types[typeId]);
});

it.each([
  ["legacy", "owner"], ["ticket types", "owner"],
  ["legacy", "attendee"], ["ticket types", "attendee"],
])("keeps a confirmed %s attachment when an earlier %s event read completes later", async (model, source) => {
  const typeId = "general" as EventTicketTypeId;
  const initialEvent = event({ formId: null, eventTicketTypes: model === "ticket types" ? {
    [typeId]: { id: typeId, name: "General Admission", price: 1500, capacity: 10, vacancy: 4, formId: null },
  } : undefined });
  jest.mocked(getEventById).mockResolvedValue(initialEvent);
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Forms");
  const pending = deferred<EventFormAttachmentResult>();
  const staleRead = deferred<EventData>();
  jest.mocked(updateEventFormAttachment).mockReturnValueOnce(pending.promise);
  const intent = { eventId: "event-1" as EventId,
    target: model === "ticket types" ? { kind: "ticketType" as const, eventTicketTypeId: typeId } : { kind: "legacyEvent" as const },
    formId: "new-form" as NonNullable<EventData["formId"]>,
  };
  act(() => { void mockRegistration.attachment.save(intent); });
  jest.mocked(getEventById).mockReturnValueOnce(staleRead.promise);
  if (source === "owner") {
    mockUserLoading = true;
    view.rerender(<OrganiserEventHubView />);
    mockUserLoading = false;
    view.rerender(<OrganiserEventHubView />);
  } else {
    await openTab("Registrations");
    act(() => { void mockAttendees.onEventRefresh!(); });
    await openTab("Forms");
  }
  const result: EventFormAttachmentResult = intent.target.kind === "legacyEvent"
    ? { ...intent, target: intent.target, eventFormIdUpdated: true }
    : { ...intent, target: { ...intent.target, ticketTypeName: "General Admission" }, eventFormIdUpdated: true };
  await act(async () => { pending.resolve(result); });
  const refreshedEvent = { ...initialEvent, capacity: 30, vacancy: 2, price: 1900,
    ...(initialEvent.eventTicketTypes ? { eventTicketTypes: {
      [typeId]: { ...initialEvent.eventTicketTypes[typeId], capacity: 30, vacancy: 2, price: 1900 },
    } } : {}),
  };
  await act(async () => { staleRead.resolve(refreshedEvent); });
  await openTab("Forms");
  expect(mockRegistration.eventData.formId).toBe("new-form");
  if (model === "ticket types") expect(mockRegistration.eventData.eventTicketTypes?.[typeId].formId).toBe("new-form");
  expect(mockRegistration.attachment.savedResult).toEqual(result);
  expect(getEventById).toHaveBeenCalledTimes(2);
  expect(updateEventFormAttachment).toHaveBeenCalledTimes(1);
  await openTab("Details");
  expect(mockListing.eventCapacity).toBe(30);
  expect(mockListing.eventVacancy).toBe(2);
  expect(mockListing.eventPrice).toBe(1900);
});

it.each(["legacy", "ticket types"])("accepts a newer server %s attachment when its read begins after the local confirmation", async (model) => {
  const typeId = "general" as EventTicketTypeId;
  const initialEvent = event({ formId: null, eventTicketTypes: model === "ticket types" ? {
    [typeId]: { id: typeId, name: "General Admission", price: 1500, capacity: 10, vacancy: 4, formId: null },
  } : undefined });
  jest.mocked(getEventById).mockResolvedValue(initialEvent);
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Forms");
  const result: EventFormAttachmentResult = model === "ticket types" ? {
    eventId: initialEvent.eventId, formId: "local-form" as NonNullable<EventData["formId"]>, eventFormIdUpdated: true,
    target: { kind: "ticketType", eventTicketTypeId: typeId, ticketTypeName: "General Admission" },
  } : {
    eventId: initialEvent.eventId, formId: "local-form" as NonNullable<EventData["formId"]>, eventFormIdUpdated: true,
    target: { kind: "legacyEvent" },
  };
  jest.mocked(updateEventFormAttachment).mockResolvedValueOnce(result);
  await act(async () => { await mockRegistration.attachment.save({ ...result, target: result.target }); });
  await openTab("Registrations");
  const serverFormId = "server-form" as NonNullable<EventData["formId"]>;
  const freshRead = deferred<EventData>();
  jest.mocked(getEventById).mockReturnValueOnce(freshRead.promise);
  let refresh!: Promise<void>;
  act(() => { refresh = mockAttendees.onEventRefresh!(); });
  await openTab("Forms");
  await act(async () => {
    freshRead.resolve({ ...initialEvent, formId: serverFormId,
      ...(initialEvent.eventTicketTypes ? { eventTicketTypes: {
        [typeId]: { ...initialEvent.eventTicketTypes[typeId], formId: serverFormId },
      } } : {}),
    });
    await refresh;
  });
  expect(mockRegistration.eventData.formId).toBe(serverFormId);
  if (model === "ticket types") expect(mockRegistration.eventData.eventTicketTypes?.[typeId].formId).toBe(serverFormId);
  expect(updateEventFormAttachment).toHaveBeenCalledTimes(1);
  expect(getEventById).toHaveBeenCalledTimes(2);
});

it("reconciles all targets confirmed during an attendee read and keeps the ordered event fallback and untouched server forms", async () => {
  const generalId = "general" as EventTicketTypeId;
  const vipId = "vip" as EventTicketTypeId;
  const untouchedId = "untouched" as EventTicketTypeId;
  const initialEvent = event({ formId: null, eventTicketTypes: {
    [generalId]: { id: generalId, name: "General Admission", price: 1500, capacity: 10, vacancy: 4, formId: null },
    [vipId]: { id: vipId, name: "VIP", price: 2000, capacity: 5, vacancy: 2, formId: null },
    [untouchedId]: { id: untouchedId, name: "Other", price: 3000, capacity: 8, vacancy: 5, formId: null },
  } });
  jest.mocked(getEventById).mockResolvedValue(initialEvent);
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Registrations");
  const staleRead = deferred<EventData>();
  jest.mocked(getEventById).mockReturnValueOnce(staleRead.promise);
  let refresh!: Promise<void>;
  act(() => { refresh = mockAttendees.onEventRefresh!(); });
  await openTab("Forms");
  const firstFormId = "first-form" as NonNullable<EventData["formId"]>;
  const vipFormId = "vip-form" as NonNullable<EventData["formId"]>;
  for (const result of [
    { eventId: initialEvent.eventId, target: { kind: "ticketType", eventTicketTypeId: generalId, ticketTypeName: "General Admission" }, formId: firstFormId, eventFormIdUpdated: true },
    { eventId: initialEvent.eventId, target: { kind: "ticketType", eventTicketTypeId: vipId, ticketTypeName: "VIP" }, formId: vipFormId, eventFormIdUpdated: false },
    { eventId: initialEvent.eventId, target: { kind: "ticketType", eventTicketTypeId: generalId, ticketTypeName: "Renamed" }, formId: null, eventFormIdUpdated: false },
  ] satisfies EventFormAttachmentResult[]) {
    jest.mocked(updateEventFormAttachment).mockResolvedValueOnce(result);
    await act(async () => { await mockRegistration.attachment.save(result); });
  }
  const serverTypes: EventTicketTypesMap = {
    ...initialEvent.eventTicketTypes!,
    [generalId]: { ...initialEvent.eventTicketTypes![generalId], vacancy: 1 },
    [untouchedId]: { ...initialEvent.eventTicketTypes![untouchedId], formId: "server-form" as NonNullable<EventData["formId"]>, capacity: 12 },
  };
  await act(async () => { staleRead.resolve({ ...initialEvent, eventTicketTypes: serverTypes }); await refresh; });
  expect(mockRegistration.eventData.formId).toBe(firstFormId);
  expect(mockRegistration.eventData.eventTicketTypes?.[generalId]).toEqual({ ...serverTypes[generalId], name: "Renamed", formId: null });
  expect(mockRegistration.eventData.eventTicketTypes?.[vipId].formId).toBe(vipFormId);
  expect(mockRegistration.eventData.eventTicketTypes?.[untouchedId]).toEqual(serverTypes[untouchedId]);
  await openTab("Details");
  expect(mockListing.eventCapacity).toBe(27);
  expect(mockListing.eventVacancy).toBe(8);
  expect(getEventById).toHaveBeenCalledTimes(2);
  expect(updateEventFormAttachment).toHaveBeenCalledTimes(3);
});

it("shares the event header/settings guard and retains rollback and Retry after a tab round trip", async () => {
  const request = deferred<void>();
  jest.mocked(updateEventById).mockReturnValueOnce(request.promise);
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Settings");
  act(() => { mockHeader.onTogglePause(); });
  await expect(mockEventSettings.saveSettings({ kind: "boolean", key: "paused", value: false })).resolves.toEqual({ kind: "busy" });
  expect(updateEventById).toHaveBeenCalledTimes(1);
  await openTab("Details");
  await act(async () => { request.reject(new Error("write failed")); });
  expect(screen.getByTestId("event-paused").textContent).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateEventById).toHaveBeenLastCalledWith("event-1", { paused: true });
  expect(screen.getByText("Saved")).toBeTruthy();
});

it("preserves the event activity distinction and rechecks paid, feature, Stripe and count gates at the owner", async () => {
  jest.mocked(getEventById).mockResolvedValue(event({ isActive: false, price: 0, capacity: 3 }));
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  act(() => mockHeader.onTogglePause());
  expect(updateEventById).not.toHaveBeenCalled();
  expect(screen.getByText(/event is inactive/)).toBeTruthy();
  await openTab("Settings");
  await act(async () => { expect(await mockEventSettings.saveSettings({ kind: "boolean", key: "paused", value: true })).toEqual({ kind: "saved" }); });
  for (const intent of [
    { kind: "boolean", key: "stripeFeeToCustomer", value: true },
    { kind: "boolean", key: "waitlistEnabled", value: true },
    { kind: "maxTickets", value: 4 },
  ] as const) {
    await act(async () => { expect(await mockEventSettings.saveSettings(intent)).toEqual({ kind: "blocked" }); });
  }
  mockUser = { ...mockUser, stripeAccountActive: false };
  view.rerender(<OrganiserEventHubView />);
  await act(async () => { expect(await mockEventSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true })).toEqual({ kind: "blocked" }); });
  expect(updateEventById).toHaveBeenCalledTimes(1);
});

it("revalidates Retry against current Stripe status and rolls back to newly loaded state", async () => {
  jest.mocked(updateEventById).mockRejectedValue(new Error("write failed"));
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Settings");
  await act(async () => { await mockEventSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true }); });
  mockUser = { ...mockUser, stripeAccountActive: false };
  view.rerender(<OrganiserEventHubView />);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateEventById).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Connect Stripe before/)).toBeTruthy();

  mockUser = { ...mockUser, stripeAccountActive: true };
  mockUserLoading = true;
  view.rerender(<OrganiserEventHubView />);
  expect(screen.getByRole("button", { name: "Retry" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(updateEventById).toHaveBeenCalledTimes(1);
  jest.mocked(getEventById).mockResolvedValue(event({ paymentsActive: true }));
  mockUserLoading = false;
  view.rerender(<OrganiserEventHubView />);
  await act(async () => undefined);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  await openTab("Settings");
  expect(mockEventSettings.paymentsActive).toBe(true);
  expect(updateEventById).toHaveBeenLastCalledWith("event-1", { paymentsActive: true });
});

it.each(["loading", "auth change", "signout"])("blocks direct event header/settings commands and retained Retry during %s", async (readiness) => {
  jest.mocked(updateEventById).mockRejectedValueOnce(new Error("write failed"));
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Settings");
  await act(async () => { await mockEventSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true }); });
  const retry = screen.getByRole("button", { name: "Retry" });
  const header = mockHeader.onTogglePause;
  const save = mockEventSettings.saveSettings;
  if (readiness === "loading") {
    mockUserLoading = true;
    view.rerender(<OrganiserEventHubView />);
    expect(retry.hasAttribute("disabled")).toBe(true);
  } else mockAuthUserId = readiness === "signout" ? null : "owner-2";
  fireEvent.click(retry);
  await act(async () => {
    header();
    expect(await save({ kind: "boolean", key: "paused", value: true })).toEqual({ kind: "blocked" });
  });
  expect(updateEventById).toHaveBeenCalledTimes(1);
  expect(mockEventSettings.paused).toBe(false);
  expect(mockEventSettings.paymentsActive).toBe(false);
  expect(screen.queryByText("Saved")).toBeNull();
});

it.each([
  ["success", "account replacement"], ["rejection", "account replacement"],
  ["success", "signout"], ["rejection", "signout"],
])("ignores event settings %s after live %s without stale rollback or feedback", async (outcome, replacement) => {
  const request = deferred<void>();
  jest.mocked(updateEventById).mockReturnValueOnce(request.promise);
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Settings");
  act(() => mockHeader.onTogglePause());
  expect(mockEventSettings.paused).toBe(true);
  mockAuthUserId = replacement === "signout" ? null : "owner-2";
  await act(async () => {
    if (outcome === "success") request.resolve();
    else request.reject(new Error("old account write failed"));
  });
  expect(mockEventSettings.paused).toBe(true);
  expect(screen.queryByText("Saved")).toBeNull();
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  expect(screen.queryByText(/previous value was restored/)).toBeNull();
  expect(updateEventById).toHaveBeenCalledTimes(1);
  expect(bustEventsLocalStorageCache).not.toHaveBeenCalled();
});

it.each([
  ["header", "success", "read first"], ["header", "rejection", "write first"],
  ["boolean", "success", "write first"], ["boolean", "rejection", "read first"],
  ["count", "success", "read first"], ["count", "rejection", "write first"],
])("retains truthful %s %s through a same-account readiness refresh with %s", async (kind, outcome, order) => {
  const request = deferred<void>();
  const read = deferred<EventData>();
  jest.mocked(updateEventById).mockReturnValueOnce(request.promise);
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  await openTab("Settings");
  const intent: EventSettingsIntent = kind === "header" ? { kind: "headerPause", value: true }
    : kind === "count" ? { kind: "maxTickets", value: 7 } : { kind: "boolean", key: "paymentsActive", value: true };
  const key = kind === "header" ? "paused" : kind === "count" ? "maxTicketsPerTransaction" : "paymentsActive";
  const desired = kind === "count" ? 7 : true;
  const previous = kind === "count" ? 2 : false;
  act(() => { void mockEventSettings.saveSettings(intent); });
  mockUserLoading = true;
  view.rerender(<OrganiserEventHubView />);
  expect(mockEventSettings[key]).toBe(desired);
  expect(screen.getByText(/Saving changes/)).toBeTruthy();
  await expect(mockEventSettings.saveSettings(intent)).resolves.toEqual({ kind: "busy" });
  jest.mocked(getEventById).mockReturnValueOnce(read.promise);
  mockUserLoading = false;
  view.rerender(<OrganiserEventHubView />);
  if (order === "read first") {
    await act(async () => { read.resolve(event({ capacity: 30, vacancy: 9 })); });
    await openTab("Settings");
    expect(mockEventSettings[key]).toBe(desired);
    expect(screen.getByText(/Saving changes/)).toBeTruthy();
  }
  await act(async () => {
    if (outcome === "success") request.resolve();
    else request.reject(new Error("write failed"));
  });
  if (order === "write first") await act(async () => { read.resolve(event({ capacity: 30, vacancy: 9 })); });
  await openTab("Settings");
  expect(mockEventSettings[key]).toBe(outcome === "success" ? desired : previous);
  expect(mockEventSettings.isSaving).toBe(false);
  expect(mockEventSettings.eventCapacity).toBe(30);
  expect(getEventById).toHaveBeenCalledTimes(2);
  expect(updateEventById).toHaveBeenCalledTimes(1);
  if (outcome === "success") expect(screen.getByText("Saved")).toBeTruthy();
  else expect(screen.getByText(/previous value was restored/)).toBeTruthy();
});

it("rechecks refreshed event activity for header Retry while Settings Registration remains writable", async () => {
  jest.mocked(updateEventById).mockRejectedValueOnce(new Error("write failed"));
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  act(() => mockHeader.onTogglePause());
  await act(async () => undefined);
  await openTab("Registrations");
  jest.mocked(getEventById).mockResolvedValueOnce(event({ isActive: false }));
  await act(async () => { await mockAttendees.onEventRefresh!(); });
  expect(mockHeader.isActive).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateEventById).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/event is inactive/)).toBeTruthy();
  await openTab("Settings");
  await act(async () => { expect(await mockEventSettings.saveSettings({ kind: "boolean", key: "paused", value: true })).toEqual({ kind: "saved" }); });
  expect(mockEventSettings.paused).toBe(true);
  expect(updateEventById).toHaveBeenLastCalledWith("event-1", { paused: true });
});

it("retains confirmed event settings when both post-write cache invalidations throw", async () => {
  jest.mocked(bustEventsLocalStorageCache).mockImplementationOnce(() => { throw new DOMException("Storage blocked", "SecurityError"); });
  jest.mocked(bustOrganiserEventsCache).mockImplementationOnce(() => { throw new Error("cache listener failed"); });
  render(<OrganiserEventHubView />);
  await act(async () => undefined);
  act(() => mockHeader.onTogglePause());
  await act(async () => undefined);
  expect(mockHeader.paused).toBe(true);
  expect(screen.getByText("Saved")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  expect(updateEventById).toHaveBeenCalledTimes(1);
  expect(bustEventsLocalStorageCache).toHaveBeenCalledTimes(1);
  expect(bustOrganiserEventsCache).toHaveBeenCalledTimes(1);
  expect(eventServiceLogger.error).toHaveBeenCalledTimes(2);
});

it.each(["event", "account"])("disposes old event settings after %s replacement", async (replacement) => {
  const request = deferred<void>();
  jest.mocked(updateEventById).mockReturnValueOnce(request.promise);
  const view = render(<OrganiserEventHubView />);
  await act(async () => undefined);
  act(() => mockHeader.onTogglePause());
  if (replacement === "event") mockId = "event-2";
  else {
    mockAuthUserId = "owner-2";
    mockUser = { ...mockUser, userId: "owner-2" as UserId };
  }
  view.rerender(<OrganiserEventHubView />);
  await act(async () => undefined);
  await act(async () => { request.reject(new Error("old failure")); });
  expect(screen.getByTestId("event-paused").textContent).toBe("false");
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
});

it.each(["loading", "mismatched"])("waits for a ready matching recurring account when initially %s", async (readiness) => {
  mockAuthUserId = "owner-2";
  if (readiness === "loading") {
    mockUser = { ...mockUser, userId: "owner-2" as UserId, stripeAccountActive: false };
    mockUserLoading = true;
  }
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  expect(getRecurrenceTemplate).not.toHaveBeenCalled();
  expect(mockListing.loading).toBe(true);
  expect(mockListing.commitBlocked).toBe(true);

  mockUser = { ...mockUser, userId: "owner-2" as UserId, stripeAccountActive: false };
  mockUserLoading = false;
  view.rerender(<RecurringPage />);
  await act(async () => undefined);
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
  expect(mockListing.loading).toBe(false);
  await openTab("Settings");
  await act(async () => {
    expect(await mockRecurringSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true })).toEqual({ kind: "blocked" });
  });
  expect(updateRecurrenceTemplateEventData).not.toHaveBeenCalled();
  expect(screen.getByText(/Connect Stripe before/)).toBeTruthy();
  mockUser = { ...mockUser, stripeAccountActive: true };
  view.rerender(<RecurringPage />);
  await act(async () => {
    expect(await mockRecurringSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true })).toEqual({ kind: "saved" });
  });
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledWith("event-1", { paymentsActive: true });
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
});

it.each(["success", "failure"])("ignores initial recurring load %s after live auth changes before rendering", async (outcome) => {
  const request = deferred<RecurrenceTemplate>();
  jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(request.promise);
  render(<RecurringPage />);
  mockAuthUserId = "owner-2";
  await act(async () => {
    if (outcome === "success") request.resolve(template({ name: "Stale template" }));
    else request.reject(new Error("old account read failed"));
  });
  expect(mockListing.loading).toBe(true);
  expect(mockListing.eventName).toBe("");
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

it.each(["loading", "auth change", "signout"])("blocks direct recurring settings and explicit handlers during %s", async (readiness) => {
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  const listing = mockListing;
  await openTab("Recurrence");
  const schedule = mockRecurrence.submitNewRecurrenceData;
  await openTab("Settings");
  const save = mockRecurringSettings.saveSettings;
  if (readiness === "loading") {
    mockUserLoading = true;
    view.rerender(<RecurringPage />);
  } else mockAuthUserId = readiness === "signout" ? null : "owner-2";

  await act(async () => {
    expect(await save({ kind: "boolean", key: "paused", value: true })).toEqual({ kind: "blocked" });
    await expect(listing.updateData("event-1" as EventId, { name: "Unsaved draft" })).rejects.toThrow(/account to finish loading/);
    await expect(listing.updateData("event-1" as EventId, { image: "unsaved-photo" })).rejects.toThrow(/account to finish loading/);
    await expect(listing.onPersistTicketTypes!({})).rejects.toThrow(/account to finish loading/);
    await expect(schedule()).rejects.toThrow(/account to finish loading/);
  });
  expect(updateRecurrenceTemplateEventData).not.toHaveBeenCalled();
  expect(updateRecurrenceTemplateRecurrenceData).not.toHaveBeenCalled();
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
  expect(mockRecurringSettings.paused).toBe(false);
  expect(screen.getAllByText(/account to finish loading/).length).toBeGreaterThan(0);
  expect(screen.queryByText("Saved")).toBeNull();
});

it("blocks retained recurring Retry during account refresh and rechecks current Stripe readiness", async () => {
  jest.mocked(updateRecurrenceTemplateEventData).mockResolvedValueOnce(false);
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Settings");
  await act(async () => { await mockRecurringSettings.saveSettings({ kind: "boolean", key: "paymentsActive", value: true }); });
  mockUserLoading = true;
  mockUser = { ...mockUser, stripeAccountActive: false };
  view.rerender(<RecurringPage />);
  expect(screen.getByRole("button", { name: "Retry" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  mockUserLoading = false;
  view.rerender(<RecurringPage />);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  expect(mockRecurringSettings.paymentsActive).toBe(false);
  expect(screen.getByText(/Connect Stripe before/)).toBeTruthy();
  mockUser = { ...mockUser, stripeAccountActive: true };
  view.rerender(<RecurringPage />);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(2);
  expect(updateRecurrenceTemplateEventData).toHaveBeenLastCalledWith("event-1", { paymentsActive: true });
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
});

it("blocks recurring Retry after live auth changes before the failed owner renders", async () => {
  jest.mocked(updateRecurrenceTemplateEventData).mockResolvedValueOnce(false);
  render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Settings");
  await act(async () => { await mockRecurringSettings.saveSettings({ kind: "boolean", key: "paused", value: true }); });
  const retry = screen.getByRole("button", { name: "Retry" });
  mockAuthUserId = "owner-2";
  fireEvent.click(retry);
  await act(async () => undefined);
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  expect(mockRecurringSettings.paused).toBe(false);
  expect(screen.queryByText("Saved")).toBeNull();
});

it.each([
  ["success", "account replacement"], ["rejection", "account replacement"],
  ["success", "signout"], ["rejection", "signout"],
])("ignores recurring settings %s after live %s without stale rollback or feedback", async (outcome, replacement) => {
  const request = deferred<boolean>();
  jest.mocked(updateRecurrenceTemplateEventData).mockReturnValueOnce(request.promise);
  render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Settings");
  let saving!: ReturnType<typeof mockRecurringSettings.saveSettings>;
  act(() => { saving = mockRecurringSettings.saveSettings({ kind: "boolean", key: "paused", value: true }); });
  expect(mockRecurringSettings.paused).toBe(true);
  mockAuthUserId = replacement === "signout" ? null : "owner-2";
  await act(async () => {
    if (outcome === "success") request.resolve(true);
    else request.reject(new Error("old account write failed"));
    expect(await saving).toEqual({ kind: "error" });
  });
  expect(mockRecurringSettings.paused).toBe(true);
  expect(screen.queryByText("Saved")).toBeNull();
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  expect(screen.queryByText(/previous value was restored/)).toBeNull();
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

it.each(["success", "rejection"])("retains truthful recurring settings %s through a same-account readiness refresh", async (outcome) => {
  const request = deferred<boolean>();
  jest.mocked(updateRecurrenceTemplateEventData).mockReturnValueOnce(request.promise);
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Settings");
  let saving!: ReturnType<typeof mockRecurringSettings.saveSettings>;
  act(() => { saving = mockRecurringSettings.saveSettings({ kind: "boolean", key: "paused", value: true }); });
  mockUserLoading = true;
  view.rerender(<RecurringPage />);
  expect(mockRecurringSettings.paused).toBe(true);
  expect(screen.getByText(/Saving changes/)).toBeTruthy();
  await act(async () => {
    if (outcome === "success") request.resolve(true);
    else request.reject(new Error("write failed"));
    expect(await saving).toEqual({ kind: outcome === "success" ? "saved" : "error" });
  });
  expect(mockRecurringSettings.paused).toBe(outcome === "success");
  if (outcome === "success") expect(screen.getByText("Saved")).toBeTruthy();
  else {
    expect(screen.getByText(/previous value was restored/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" }).hasAttribute("disabled")).toBe(true);
  }
  mockUserLoading = false;
  view.rerender(<RecurringPage />);
  expect(mockRecurringSettings.isSaving).toBe(false);
  expect(mockRecurringSettings.loading).toBe(false);
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
});

it.each([["success", "owner-2"], ["rejection", "owner-2"], ["success", null], ["rejection", null]])(
  "rejects stale detail %s under live auth %s and releases restored-owner commits", async (outcome, replacement) => {
  const request = deferred<boolean>();
  render(<RecurringPage />);
  await act(async () => undefined);
  jest.mocked(updateRecurrenceTemplateEventData).mockReturnValueOnce(request.promise);
  let saving!: Promise<void>;
  act(() => { saving = mockListing.updateData("event-1" as EventId, { name: "Stale name" }); });
  expect(mockListing.commitBlocked).toBe(true);
  mockAuthUserId = replacement;
  await act(async () => {
    if (outcome === "success") request.resolve(true);
    else request.reject(new Error("old account write failed"));
    await expect(saving).rejects.toThrow(outcome === "success" ? "This series is no longer open." : "old account write failed");
  });
  expect(mockListing.eventName).toBe("Current event");
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).not.toHaveBeenCalled();
  mockAuthUserId = "owner-1";
  await openTab("Settings");
  expect(mockRecurringSettings.isSaving).toBe(false);
  await openTab("Details");
  expect(mockListing.commitBlocked).toBe(false);
  await act(async () => { await mockListing.updateData("event-1" as EventId, { name: "Kept draft" }); });
  expect(mockListing.eventName).toBe("Kept draft");
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(2);
});

it("coordinates template settings, details, photos, ticket types and schedule across tabs", async () => {
  const request = deferred<boolean>();
  jest.mocked(updateRecurrenceTemplateEventData).mockReturnValueOnce(request.promise);
  render(<RecurringPage />);
  await act(async () => undefined);
  const listing = mockListing;
  await openTab("Recurrence");
  const schedule = mockRecurrence.submitNewRecurrenceData;
  await openTab("Settings");
  act(() => { void mockRecurringSettings.saveSettings({ kind: "boolean", key: "paused", value: true }); });
  await expect(listing.updateData("event-1" as EventId, { name: "Draft" })).rejects.toThrow(/Wait/);
  await expect(listing.updateData("event-1" as EventId, { image: "draft-photo" })).rejects.toThrow(/Wait/);
  await expect(listing.onPersistTicketTypes!({})).rejects.toThrow(/Wait/);
  await act(async () => { await expect(schedule()).rejects.toThrow(/Wait/); });
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  expect(updateRecurrenceTemplateRecurrenceData).not.toHaveBeenCalled();
  await openTab("Details");
  expect(mockListing.commitBlocked).toBe(true);
  await act(async () => { request.resolve(false); });
  expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  await openTab("Settings");
  expect(mockRecurringSettings.paused).toBe(false);
  await openTab("Details");
  await act(async () => { await mockListing.updateData("event-1" as EventId, { name: "Kept draft" }); });
  expect(mockListing.eventName).toBe("Kept draft");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(updateRecurrenceTemplateEventData).toHaveBeenLastCalledWith("event-1", { paused: true });
});

it("holds the template guard through schedule status reads and retains confirmed success when status fails", async () => {
  const statusRead = deferred<RecurrenceTemplate>();
  render(<RecurringPage />);
  await act(async () => undefined);
  const listing = mockListing;
  await openTab("Settings");
  jest.mocked(updateRecurrenceTemplateEventData).mockResolvedValueOnce(false);
  await act(async () => { await mockRecurringSettings.saveSettings({ kind: "boolean", key: "paused", value: true }); });
  const saveSettings = mockRecurringSettings.saveSettings;
  await openTab("Recurrence");
  const submitted = { ...mockRecurrence.newRecurrenceData, recurrenceAmount: 3 };
  act(() => mockRecurrence.setNewRecurrenceData(submitted));
  jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(statusRead.promise);
  let saving: void | Promise<void> = undefined;
  act(() => { saving = mockRecurrence.submitNewRecurrenceData(); });
  await act(async () => undefined);
  expect(mockRecurrence.saveBlocked).toBe(true);
  await expect(listing.updateData("event-1" as EventId, { image: "photo" })).rejects.toThrow(/Wait/);
  await expect(saveSettings({ kind: "boolean", key: "hideVacancy", value: true })).resolves.toEqual({ kind: "busy" });
  expect(screen.getByRole("button", { name: "Retry" }).hasAttribute("disabled")).toBe(true);
  act(() => mockRecurrence.setNewRecurrenceData({ ...submitted, recurrenceAmount: 4 }));
  await act(async () => { statusRead.reject(new Error("read failed")); await saving; });
  expect(screen.getByText("Schedule saved.")).toBeTruthy();
  expect(mockRecurrence.originalRecurrenceData?.recurrenceAmount).toBe(3);
  expect(mockRecurrence.newRecurrenceData.recurrenceAmount).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(screen.getByText(/Series status is unavailable/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Reload page" })).toBeTruthy();
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(1);
  await openTab("Settings");
  expect(mockRecurringSettings.seriesStatus).toBe("unavailable");
});

it("preserves recurring schedule drafts and the status lock through a same-account readiness refresh", async () => {
  const write = deferred<void>();
  const statusRead = deferred<RecurrenceTemplate>();
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Recurrence");
  const submitted = { ...mockRecurrence.newRecurrenceData, recurrenceAmount: 3 };
  act(() => mockRecurrence.setNewRecurrenceData(submitted));
  jest.mocked(updateRecurrenceTemplateRecurrenceData).mockReturnValueOnce(write.promise);
  jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(statusRead.promise);
  let saving: void | Promise<void> = undefined;
  act(() => { saving = mockRecurrence.submitNewRecurrenceData(); });
  act(() => mockRecurrence.setNewRecurrenceData({ ...submitted, recurrenceAmount: 4 }));
  mockUserLoading = true;
  view.rerender(<RecurringPage />);
  expect(mockRecurrence.newRecurrenceData.recurrenceAmount).toBe(4);
  expect(mockRecurrence.loading).toBe(false);
  expect(mockRecurrence.saveBlocked).toBe(true);
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
  await act(async () => { write.resolve(); });
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(2);
  mockUserLoading = false;
  view.rerender(<RecurringPage />);
  expect(mockRecurrence.newRecurrenceData.recurrenceAmount).toBe(4);
  expect(mockRecurrence.saveBlocked).toBe(true);
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(2);
  await act(async () => { await expect(mockRecurrence.submitNewRecurrenceData()).rejects.toThrow(/Wait for the current change/); });
  await act(async () => { statusRead.resolve(template()); await saving; });
  expect(mockRecurrence.originalRecurrenceData?.recurrenceAmount).toBe(3);
  expect(mockRecurrence.newRecurrenceData.recurrenceAmount).toBe(4);
  expect(mockRecurrence.saveBlocked).toBe(false);
  expect(screen.getByText("Schedule saved.")).toBeTruthy();
  await openTab("Details");
  await act(async () => { await mockListing.updateData("event-1" as EventId, { name: "Resumed edit" }); });
  expect(mockListing.eventName).toBe("Resumed edit");
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(2);
  expect(updateRecurrenceTemplateRecurrenceData).toHaveBeenCalledTimes(1);
});

it("completes one initial recurring load through a same-account readiness refresh", async () => {
  const request = deferred<RecurrenceTemplate>();
  jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(request.promise);
  const view = render(<RecurringPage />);
  mockUserLoading = true;
  view.rerender(<RecurringPage />);
  mockUserLoading = false;
  view.rerender(<RecurringPage />);
  await act(async () => { request.resolve(template({ name: "Loaded once" })); });
  expect(mockListing.loading).toBe(false);
  expect(mockListing.eventName).toBe("Loaded once");
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(1);
});

it.each([["write", "success"], ["write", "rejection"], ["status read", "success"], ["status read", "rejection"]])(
  "suppresses stale schedule %s %s and releases restored-owner commits", async (phase, outcome) => {
  const write = deferred<void>();
  const statusRead = deferred<RecurrenceTemplate>();
  render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Recurrence");
  const originalAmount = mockRecurrence.originalRecurrenceData?.recurrenceAmount;
  const submitted = { ...mockRecurrence.newRecurrenceData, recurrenceAmount: 3 };
  act(() => mockRecurrence.setNewRecurrenceData(submitted));
  jest.mocked(updateRecurrenceTemplateRecurrenceData).mockReturnValueOnce(write.promise);
  if (phase === "status read") jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(statusRead.promise);
  let saving: void | Promise<void> = undefined;
  act(() => { saving = mockRecurrence.submitNewRecurrenceData(); });
  act(() => mockRecurrence.setNewRecurrenceData({ ...submitted, recurrenceAmount: 4 }));
  if (phase === "status read") {
    await act(async () => { write.resolve(); });
    mockAuthUserId = null;
    await act(async () => {
      if (outcome === "success") statusRead.resolve(template({ isActive: false }));
      else statusRead.reject(new Error("old account status read failed"));
      await saving;
    });
  } else {
    mockAuthUserId = "owner-2";
    await act(async () => {
      if (outcome === "success") write.resolve();
      else write.reject(new Error("old account write failed"));
      await saving;
    });
  }
  expect(getRecurrenceTemplate).toHaveBeenCalledTimes(phase === "status read" ? 2 : 1);
  expect(screen.queryByText("Schedule saved.")).toBeNull();
  expect(screen.queryByText("Failed to save schedule. Try again.")).toBeNull();
  mockAuthUserId = "owner-1";
  await openTab("Settings");
  expect(mockRecurringSettings.seriesStatus).toBe("active");
  expect(mockRecurringSettings.isSaving).toBe(false);
  expect(mockRouter.push).not.toHaveBeenCalled();
  await openTab("Recurrence");
  expect(mockRecurrence.newRecurrenceData.recurrenceAmount).toBe(4);
  expect(mockRecurrence.originalRecurrenceData?.recurrenceAmount).toBe(phase === "status read" ? 3 : originalAmount);
  expect(mockRecurrence.updating).toBe(false);
  expect(mockRecurrence.saveBlocked).toBe(false);
  await act(async () => { await mockRecurrence.submitNewRecurrenceData(); });
  expect(updateRecurrenceTemplateRecurrenceData).toHaveBeenCalledTimes(2);
  expect(updateRecurrenceTemplateRecurrenceData).toHaveBeenLastCalledWith("event-1", { ...submitted, recurrenceAmount: 4 });
  expect(mockRecurrence.originalRecurrenceData?.recurrenceAmount).toBe(4);
  expect(screen.getByText("Schedule saved.")).toBeTruthy();
});

it("blocks count Retry after a capacity edit and rejects false detail saves without reconciling them", async () => {
  render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Settings");
  jest.mocked(updateRecurrenceTemplateEventData).mockResolvedValueOnce(false);
  await act(async () => { await mockRecurringSettings.saveSettings({ kind: "maxTickets", value: 7 }); });
  await openTab("Details");
  await act(async () => { await mockListing.onPersistTicketTypes!({
    ["general" as EventTicketTypeId]: { id: "general" as EventTicketTypeId, name: "General", price: 1500, capacity: 3, vacancy: 3, formId: null },
  }); });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => undefined);
  expect(screen.getByText(/from 1 to 3/)).toBeTruthy();
  expect(updateRecurrenceTemplateEventData).toHaveBeenCalledTimes(2);
  jest.mocked(updateRecurrenceTemplateEventData).mockResolvedValueOnce(false);
  await act(async () => { await expect(mockListing.updateData("event-1" as EventId, { name: "Unsaved" })).rejects.toThrow(/Couldn’t save/); });
  expect(mockListing.eventName).toBe("Current event");
  expect(mockListing.commitBlocked).toBe(false);
});

it("disposes template status reconciliation and retry when the account changes", async () => {
  const statusRead = deferred<RecurrenceTemplate>();
  const view = render(<RecurringPage />);
  await act(async () => undefined);
  await openTab("Recurrence");
  jest.mocked(getRecurrenceTemplate).mockReturnValueOnce(statusRead.promise);
  act(() => { void mockRecurrence.submitNewRecurrenceData(); });
  await act(async () => undefined);
  mockUser = { ...mockUser, userId: "owner-2" as UserId };
  mockAuthUserId = "owner-2";
  view.rerender(<RecurringPage />);
  await act(async () => undefined);
  await act(async () => { statusRead.resolve(template({ isActive: false })); });
  expect(screen.queryByText("Schedule saved.")).toBeNull();
  await openTab("Settings");
  expect(mockRecurringSettings.seriesStatus).toBe("active");
});
