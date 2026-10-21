/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Auth } from "firebase/auth";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, EventData, EventFormAttachmentIntent, EventFormAttachmentResult, EventId } from "@/interfaces/EventTypes";
import { EmptyForm, EmptyFormResponse, Form, FormId, FormResponse, FormResponseId, FormTitle } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { EventFormAttachmentTargetError, updateEventFormAttachment } from "@/services/src/events/eventsService";
import { applyEventFormAttachmentToTicketTypes, GENERAL_TICKET_TYPE_NAME } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { EventHubRegistration } from "./EventHubRegistration";
import { EventFormAttachmentController, useEventFormAttachment } from "./useEventFormAttachment";
jest.mock("@/components/utility/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("@/interfaces/EventTicketTypeTypes", () => ({
  ...jest.requireActual("@/interfaces/EventTicketTypeTypes"), createEmptyEventTicketTypes: () => ({}),
}));
jest.mock("@/observability/logger", () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));
jest.mock("@/services/src/events/eventsService", () => ({
  updateEventFormAttachment: jest.fn(),
  EventFormAttachmentTargetError: class EventFormAttachmentTargetError extends Error {},
}));
jest.mock("@/services/src/forms/formsServices", () => ({
  getForm: jest.fn(), getFormResponsesForEvent: jest.fn(), submitManualFormResponse: jest.fn(),
}));
jest.mock("@/services/src/forms/formsUtils/formsUtils", () => ({
  getApprovedOrderTicketsMap: (orders: Map<Order, Ticket[]>) => orders,
  filterFormResponsesForApprovedOrders: (responses: FormResponse[]) => responses,
  filterFormResponsesForTicketType: (responses: FormResponse[]) => responses,
  getFormSectionAnswerDisplay: jest.fn(),
}));
jest.mock("@/components/DownloadCsvButton", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/forms/FormResponder", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/organiser/event/forms/FormResponsesTable", () => ({
  FormResponsesTable: ({ form, formResponses }: { form: Form; formResponses: FormResponse[] }) => (
    <div data-testid="responses">{form.title}: {formResponses.map((response) => response.formResponseId).join(", ")}</div>
  ),
}));
jest.mock("@/components/events/create/forms/FormSelector", () => ({
  FormSelector: ({ formId, updateField, disabled }: {
    formId: FormId | null; updateField: (formId: FormId | null) => void; disabled?: boolean;
  }) => (
    <select aria-label="Select Form" value={formId ?? ""} disabled={disabled} onChange={(event) => updateField((event.target.value || null) as FormId | null)}>
      <option value="">No form</option>
      <option value="old-form">Old form</option>
      <option value="new-form">New form</option>
      <option value="vip-form">VIP form</option>
    </select>
  ),
}));
jest.mock("./EventHubPanel", () => ({
  EventHubPanel: ({ open, onClose, title, saving, children, footer }: {
    open: boolean; onClose: () => void; title: string; saving?: boolean; children: ReactNode; footer?: ReactNode;
  }) => open ? (
    <section role="dialog" aria-label={title}>
      <button disabled={saving} onClick={onClose}>Close panel</button>
      {children}{footer}
    </section>
  ) : null,
}));

const saveAttachment = jest.mocked(updateEventFormAttachment);
const loadForm = jest.mocked(getForm);
const loadResponses = jest.mocked(getFormResponsesForEvent);
const reloadEvent = jest.fn<Promise<EventData>, []>();
const eventId = "event-1" as EventId;
const organiserId = "organiser-1" as UserId;
const generalId = "general.type" as EventTicketTypeId;
const vipId = "vip" as EventTicketTypeId;
const oldFormId = "old-form" as FormId;
const newFormId = "new-form" as FormId;
const vipFormId = "vip-form" as FormId;
const orders = new Map<Order, Ticket[]>();
let replaceTypes: Dispatch<SetStateAction<EventTicketTypesMap | undefined>>;
let currentAttachment: EventFormAttachmentController;
let auth: Auth;

function ticketTypes(formId: FormId | null = oldFormId): EventTicketTypesMap {
  return {
    [generalId]: { id: generalId, name: GENERAL_TICKET_TYPE_NAME, price: 10, capacity: 20, vacancy: 7, formId },
    [vipId]: { id: vipId, name: "VIP", price: 25, capacity: 10, vacancy: 4, formId: vipFormId },
  };
}

function event(types?: EventTicketTypesMap, formId: FormId | null = oldFormId): EventData {
  return { ...EmptyEventData, eventId, organiserId, eventTicketTypes: types, formId };
}

function form(formId: FormId): Form {
  return { ...EmptyForm, formId, title: `${formId} title` as FormTitle };
}

function responses(formId: FormId): FormResponse[] {
  return [{ ...EmptyFormResponse, formId, eventId, formResponseId: `${formId} answer` as FormResponseId }];
}

function committed(intent: EventFormAttachmentIntent, ticketTypeName = GENERAL_TICKET_TYPE_NAME): EventFormAttachmentResult {
  return intent.target.kind === "legacyEvent"
    ? { ...intent, target: intent.target, eventFormIdUpdated: true }
    : { ...intent, target: { ...intent.target, ticketTypeName }, eventFormIdUpdated: ticketTypeName === GENERAL_TICKET_TYPE_NAME };
}

function Harness({ initialEvent, onSaved = jest.fn(), showRegistration = true }: {
  initialEvent: EventData; onSaved?: (result: EventFormAttachmentResult) => void; showRegistration?: boolean;
}) {
  const { auth, user } = useUser();
  return <HarnessOwner key={`${initialEvent.eventId}:${auth.currentUser?.uid ?? ""}:${user.userId}`} initialEvent={initialEvent} onSaved={onSaved} showRegistration={showRegistration} />;
}

function HarnessOwner({ initialEvent, onSaved, showRegistration }: {
  initialEvent: EventData; onSaved: (result: EventFormAttachmentResult) => void; showRegistration: boolean;
}) {
  const { auth, user, userLoading } = useUser();
  const ownerActiveRef = useRef(true);
  const [ownerUserId] = useState(user.userId);
  const authRef = useRef(auth);
  const accountRef = useRef(user.userId);
  useLayoutEffect(() => {
    authRef.current = auth;
    accountRef.current = user.userId;
  }, [auth, user.userId]);
  const isCurrentAccount = useCallback(() => ownerActiveRef.current && Boolean(ownerUserId) &&
    accountRef.current === ownerUserId && authRef.current.currentUser?.uid === ownerUserId, [ownerUserId]);
  const accountReady = !userLoading && Boolean(ownerUserId) && user.userId === ownerUserId && auth.currentUser?.uid === ownerUserId;
  const [eventData, setEventData] = useState(initialEvent);
  const attachment = useEventFormAttachment({
    eventId: initialEvent.eventId,
    canSave: accountReady && eventData.organiserId === ownerUserId,
    isCurrentAccount,
    onReloadTargets: async () => {
      const nextEvent = await reloadEvent();
      if (isCurrentAccount()) setEventData(nextEvent);
    },
    onSaved: (result) => {
      onSaved(result);
      if (!isCurrentAccount()) return;
      const previousName = result.target.kind === "ticketType"
        ? eventData.eventTicketTypes?.[result.target.eventTicketTypeId]?.name
        : undefined;
      setEventData((current) => ({
        ...current,
        eventTicketTypes: applyEventFormAttachmentToTicketTypes(current.eventTicketTypes, result, previousName),
        ...(result.eventFormIdUpdated ? { formId: result.formId } : {}),
      }));
    },
  });
  useEffect(() => { currentAttachment = attachment; }, [attachment]);
  useEffect(() => {
    ownerActiveRef.current = true;
    replaceTypes = (update) => setEventData((current) => ({
      ...current,
      eventTicketTypes: typeof update === "function" ? update(current.eventTicketTypes) : update,
    }));
    return () => { ownerActiveRef.current = false; };
  }, []);
  return <>
    {showRegistration ? <EventHubRegistration eventId={initialEvent.eventId} eventData={eventData} loading={false} orderTicketsMap={orders} attachment={attachment} /> : null}
    <div data-testid="ticket-types" hidden>{JSON.stringify(eventData.eventTicketTypes)}</div>
    <div data-testid="event-form" hidden>{eventData.formId}</div>
  </>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

async function openChangeForm() {
  await screen.findByTestId("responses");
  fireEvent.click(screen.getByRole("button", { name: /Change form/ }));
}

beforeEach(() => {
  jest.clearAllMocks();
  loadForm.mockReset().mockImplementation(async (id) => form(id));
  loadResponses.mockReset().mockImplementation(async (id) => responses(id));
  saveAttachment.mockReset().mockImplementation(async (intent) => committed(intent));
  reloadEvent.mockReset();
  auth = { currentUser: { uid: "organiser-1" } } as Auth;
  jest.mocked(useUser).mockReturnValue({
    user: { ...EmptyUserData, userId: organiserId }, userLoading: false,
    auth, setUser: jest.fn(), refreshUser: jest.fn(),
  });
});

it("keeps the failed choice and retries its stable target without replaying newer local inventory or siblings", async () => {
  const initialEvent = event(ticketTypes());
  const first = deferred<EventFormAttachmentResult>();
  const retry = deferred<EventFormAttachmentResult>();
  const onSaved = jest.fn();
  saveAttachment.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
  render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  await openChangeForm();

  act(() => {
    fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
    fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: oldFormId } });
    fireEvent.change(screen.getByRole("combobox", { name: "Ticket type" }), { target: { value: vipId } });
  });
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("combobox", { name: "Ticket type" })).toHaveValue(generalId);
  expect(screen.getByRole("combobox", { name: "Ticket type" })).toBeDisabled();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Close panel" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saving form");

  await act(async () => { first.reject(new Error("private write details")); });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(newFormId);
  expect(screen.getByRole("alert")).toHaveTextContent("Your choice is kept");
  expect(screen.queryByText("private write details")).not.toBeInTheDocument();
  expect(screen.getByTestId("responses")).toHaveTextContent("old-form answer");
  act(() => { replaceTypes((current) => ({
    ...current!,
    [generalId]: { ...current![generalId], capacity: 40, vacancy: 2 },
    [vipId]: { ...current![vipId], price: 30, vacancy: 1, formId: newFormId },
  })); });
  const latestTypes = JSON.parse(screen.getByTestId("ticket-types").textContent!);
  fireEvent.click(screen.getByRole("button", { name: "Retry attachment" }));
  const intent: EventFormAttachmentIntent = { eventId, target: { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId };
  expect(saveAttachment).toHaveBeenNthCalledWith(1, intent);
  expect(saveAttachment).toHaveBeenNthCalledWith(2, intent);
  await act(async () => { retry.resolve(committed(intent)); });

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Form saved");
  expect(await screen.findByTestId("responses")).toHaveTextContent("new-form answer");
  expect(loadResponses).toHaveBeenCalledTimes(2);
  expect(onSaved).toHaveBeenCalledWith(committed(intent));
  expect(JSON.parse(screen.getByTestId("ticket-types").textContent!)).toEqual({
    ...latestTypes, [generalId]: { ...latestTypes[generalId], formId: newFormId },
  });
});

it.each([GENERAL_TICKET_TYPE_NAME, "Renamed VIP"])("preserves a failed detach and resolves authoritative %s metadata without loading the old event form", async (name) => {
  const initialEvent = event(ticketTypes());
  saveAttachment.mockRejectedValueOnce(new Error("offline")).mockImplementationOnce(async (intent) => committed(intent, name));
  render(<Harness initialEvent={initialEvent} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: "" } });
  expect(await screen.findByRole("alert")).toHaveTextContent("could not be detached");
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Retry detachment" }));

  expect(await screen.findByText("Form saved")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByTestId("responses")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue("");
  expect(loadResponses).toHaveBeenCalledTimes(1);
  expect(saveAttachment).toHaveBeenLastCalledWith({ eventId, target: { kind: "ticketType", eventTicketTypeId: generalId }, formId: null });
});

it.each(["legacy", "ticket types"])("distinguishes a successful %s write from a failed read and retries only the read", async (model) => {
  const initialEvent = event(model === "legacy" ? undefined : ticketTypes());
  loadResponses.mockResolvedValueOnce(responses(oldFormId)).mockRejectedValueOnce(new Error("private read details")).mockResolvedValueOnce(responses(newFormId));
  render(<Harness initialEvent={initialEvent} />);
  await openChangeForm();
  expect(loadResponses).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });

  expect(await screen.findByRole("alert")).toHaveTextContent("Form saved, but responses could not be loaded");
  expect(screen.getByRole("status")).toHaveTextContent("Form saved");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("private read details")).not.toBeInTheDocument();
  expect(screen.queryByTestId("responses")).not.toBeInTheDocument();
  expect(loadResponses).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Retry loading responses" }));

  expect(await screen.findByTestId("responses")).toHaveTextContent("new-form answer");
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  expect(loadResponses).toHaveBeenCalledTimes(3);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it.each(["replacement", "signout"])("blocks a retained response Retry after auth %s before the owner renders", async (change) => {
  loadResponses.mockRejectedValueOnce(new Error("private read details"));
  render(<Harness initialEvent={event(ticketTypes())} />);
  const retry = await screen.findByRole("button", { name: "Retry loading responses" });
  const typeSelector = screen.getByRole("combobox", { name: "Ticket type" });
  const retainedSave = currentAttachment.save;
  const originalAuthUser = auth.currentUser;
  Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "other-auth" } });
  fireEvent.click(retry);
  expect(loadForm).toHaveBeenCalledTimes(1);
  expect(loadResponses).toHaveBeenCalledTimes(1);
  expect(saveAttachment).not.toHaveBeenCalled();

  Object.assign(auth, { currentUser: originalAuthUser });
  fireEvent.click(retry);
  expect(await screen.findByTestId("responses")).toHaveTextContent("old-form answer");
  expect(screen.getByRole("combobox", { name: "Ticket type" })).toBe(typeSelector);
  expect(currentAttachment.save).toBe(retainedSave);
  expect(loadResponses).toHaveBeenCalledTimes(2);
  expect(saveAttachment).not.toHaveBeenCalled();
});

it.each([
  ["success", "replacement"], ["success", "signout"],
  ["error", "replacement"], ["error", "signout"],
])("discards response read %s after auth %s and permits deliberate recovery by the restored owner", async (outcome, change) => {
  const pendingForm = deferred<Form>();
  const pendingResponses = deferred<FormResponse[]>();
  const initialEvent = event(ticketTypes());
  loadForm.mockResolvedValueOnce(form(oldFormId)).mockReturnValueOnce(pendingForm.promise);
  loadResponses.mockResolvedValueOnce(responses(oldFormId)).mockReturnValueOnce(pendingResponses.promise);
  const view = render(<Harness initialEvent={initialEvent} />);
  await screen.findByTestId("responses");
  const typeSelector = screen.getByRole("combobox", { name: "Ticket type" });
  fireEvent.change(typeSelector, { target: { value: vipId } });
  await waitFor(() => expect(loadResponses).toHaveBeenCalledTimes(2));
  const retainedSave = currentAttachment.save;
  const originalAuthUser = auth.currentUser;
  Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "other-auth" } });
  await act(async () => {
    pendingForm.resolve(form(vipFormId));
    if (outcome === "success") pendingResponses.resolve(responses(vipFormId));
    else pendingResponses.reject(new Error("private read details"));
  });
  expect(screen.queryByTestId("responses")).not.toBeInTheDocument();
  expect(screen.queryByText(/(?:old|vip)-form title/)).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByText(/No responses yet/)).not.toBeInTheDocument();
  expect(saveAttachment).not.toHaveBeenCalled();

  Object.assign(auth, { currentUser: originalAuthUser });
  view.rerender(<Harness initialEvent={initialEvent} />);
  expect(screen.getByRole("combobox", { name: "Ticket type" })).toBe(typeSelector);
  expect(typeSelector).toHaveValue(vipId);
  expect(currentAttachment.save).toBe(retainedSave);
  expect(screen.queryByTestId("responses")).not.toBeInTheDocument();
  expect(screen.queryByText(/No responses yet/)).not.toBeInTheDocument();
  const retry = screen.getByRole("button", { name: "Retry loading responses" });
  expect(retry).toBeEnabled();
  expect(screen.getByRole("button", { name: /Add answers/ })).toBeDisabled();
  expect(loadResponses).toHaveBeenCalledTimes(2);
  fireEvent.click(retry);
  expect(await screen.findByTestId("responses")).toHaveTextContent("vip-form title: vip-form answer");
  expect(loadResponses).toHaveBeenCalledTimes(3);
  expect(saveAttachment).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it.each(["ticket type", "form"])("commits form and responses together and discards old reads after a %s change", async (change) => {
  const initialEvent = event(ticketTypes());
  const oldForm = deferred<Form>();
  const oldResponses = deferred<FormResponse[]>();
  const nextForm = deferred<Form>();
  const nextResponses = deferred<FormResponse[]>();
  const nextFormId = change === "ticket type" ? vipFormId : newFormId;
  loadForm.mockReturnValueOnce(oldForm.promise).mockReturnValueOnce(nextForm.promise);
  loadResponses.mockReturnValueOnce(oldResponses.promise).mockReturnValueOnce(nextResponses.promise);
  render(<Harness initialEvent={initialEvent} />);
  await waitFor(() => expect(loadResponses).toHaveBeenCalledTimes(1));
  if (change === "ticket type") {
    fireEvent.change(screen.getByRole("combobox", { name: "Ticket type" }), { target: { value: vipId } });
  } else {
    act(() => { replaceTypes((current) => ({ ...current!, [generalId]: { ...current![generalId], formId: newFormId } })); });
  }
  await waitFor(() => expect(loadResponses).toHaveBeenCalledTimes(2));
  await act(async () => { nextForm.resolve(form(nextFormId)); });
  expect(screen.queryByText(`${nextFormId} title`, { exact: false })).not.toBeInTheDocument();
  expect(screen.queryByTestId("responses")).not.toBeInTheDocument();
  await act(async () => { nextResponses.resolve(responses(nextFormId)); });
  expect(screen.getByTestId("responses")).toHaveTextContent(`${nextFormId} answer`);
  await act(async () => { oldForm.resolve(form(oldFormId)); oldResponses.resolve(responses(oldFormId)); });
  expect(screen.getByTestId("responses")).toHaveTextContent(`${nextFormId} answer`);
  expect(screen.getByTestId("responses")).not.toHaveTextContent("old-form answer");
  expect(saveAttachment).not.toHaveBeenCalled();
});

it.each([
  ["legacy conversion", newFormId], ["legacy conversion", null],
  ["removed type", newFormId], ["removed type", null],
])("reloads targets after %s while keeping the requested %s choice for deliberate application", async (model, requestedFormId) => {
  const initialEvent = event(model === "legacy conversion" ? undefined : ticketTypes());
  saveAttachment.mockRejectedValueOnce(new EventFormAttachmentTargetError(model === "legacy conversion"
    ? "This event now uses ticket types. Choose a current ticket type and try again."
    : "This ticket type no longer exists. Choose a current ticket type and try again."));
  const pendingReload = deferred<EventData>();
  const refreshedEvent = event({ [vipId]: ticketTypes()[vipId] });
  reloadEvent.mockRejectedValueOnce(new Error("private reload details")).mockReturnValueOnce(pendingReload.promise);
  render(<Harness initialEvent={initialEvent} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: requestedFormId ?? "" } });
  expect(await screen.findByRole("alert")).toHaveTextContent("Choose a current ticket type");
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(requestedFormId ?? "");
  expect(screen.getByRole("combobox", { name: "Select Form" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: /Retry (attachment|detachment)/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Ticket types could not be reloaded. Your form choice is kept"));
  expect(screen.queryByText("private reload details")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(requestedFormId ?? "");
  fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  expect(reloadEvent).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Close panel" })).toBeDisabled();
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  await act(async () => { pendingReload.resolve(refreshedEvent); });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(requestedFormId ?? "");
  expect(screen.getByRole("combobox", { name: "Ticket type" })).toHaveValue("");
  expect(screen.getByRole("button", { name: requestedFormId ? "Apply form" : "Apply detachment" })).toBeDisabled();
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByRole("combobox", { name: "Ticket type" }), { target: { value: vipId } });
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(requestedFormId ?? "");
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: requestedFormId ? "Apply form" : "Apply detachment" }));
  expect(await screen.findByText("Form saved")).toBeInTheDocument();
  expect(saveAttachment).toHaveBeenCalledTimes(2);
  expect(saveAttachment).toHaveBeenLastCalledWith({ eventId, target: { kind: "ticketType", eventTicketTypeId: vipId }, formId: requestedFormId });
});

it.each(["event", "account", "auth"])("discards an old attachment completion after %s replacement", async (replacement) => {
  const pending = deferred<EventFormAttachmentResult>();
  const onSaved = jest.fn();
  const initialEvent = event(undefined, null);
  saveAttachment.mockReturnValueOnce(pending.promise);
  const view = render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  const nextEvent = replacement === "event" ? { ...initialEvent, eventId: "event-2" as EventId } : initialEvent;
  if (replacement !== "event") {
    const context = jest.mocked(useUser).mock.results.at(-1)!.value;
    jest.mocked(useUser).mockReturnValue({ ...context,
      ...(replacement === "account" ? { user: { ...context.user, userId: "other-owner" as UserId } }
        : { auth: { currentUser: { uid: "other-auth" } } as Auth }),
    });
  }
  view.rerender(<Harness initialEvent={nextEvent} onSaved={onSaved} />);
  await act(async () => { pending.resolve(committed({ eventId, target: { kind: "legacyEvent" }, formId: newFormId })); });
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.queryByText("Form saved")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue("");
  expect(screen.getByTestId("event-form")).toBeEmptyDOMElement();
  expect(loadResponses).not.toHaveBeenCalled();
});

it.each([
  ["save", "replacement"], ["save", "signout"],
  ["reload", "replacement"], ["reload", "signout"],
])("blocks a retained %s command after auth %s before the owner renders", async (command, change) => {
  const intent: EventFormAttachmentIntent = { eventId, target: { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId };
  if (command === "reload") saveAttachment.mockRejectedValueOnce(new EventFormAttachmentTargetError("Choose a current ticket type."));
  render(<Harness initialEvent={event(ticketTypes())} />);
  await openChangeForm();
  if (command === "reload") {
    fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
    await screen.findByRole("alert");
  }
  const retained = currentAttachment;
  const panel = screen.getByRole("dialog");
  Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "other-auth" } });
  await act(async () => {
    if (command === "save") await retained.save(intent);
    else await retained.reloadTargets();
    retained.selectType(vipId);
    retained.showPanel(false);
  });
  expect(saveAttachment).toHaveBeenCalledTimes(command === "save" ? 0 : 1);
  expect(reloadEvent).not.toHaveBeenCalled();
  expect(panel).toBeInTheDocument();
  expect(currentAttachment.selectedTypeId).toBe(generalId);
  expect(screen.queryByText("Form saved")).not.toBeInTheDocument();
});

it.each([
  ["success", "replacement"], ["success", "signout"],
  ["error", "replacement"], ["error", "signout"],
])("discards attachment %s after auth %s and releases the settled attempt for the restored owner", async (outcome, change) => {
  const pending = deferred<EventFormAttachmentResult>();
  const onSaved = jest.fn();
  const intent: EventFormAttachmentIntent = { eventId, target: { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId };
  saveAttachment.mockReturnValueOnce(pending.promise);
  const initialEvent = event(ticketTypes());
  const view = render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  const retainedSave = currentAttachment.save;
  const originalAuthUser = auth.currentUser;
  Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "other-auth" } });
  await act(async () => {
    if (outcome === "success") pending.resolve(committed(intent));
    else pending.reject(new Error("write failed"));
  });
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.queryByText("Form saved")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Retry (attachment|detachment)/ })).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(currentAttachment).toMatchObject({ intent, error: null, savedResult: null, panelOpen: true, isSaving: false });
  expect(screen.getByTestId("event-form")).toHaveTextContent(oldFormId);
  expect(saveAttachment).toHaveBeenCalledTimes(1);

  Object.assign(auth, { currentUser: originalAuthUser });
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  expect(currentAttachment.save).toBe(retainedSave);
  await act(async () => { await currentAttachment.save(intent); });
  expect(saveAttachment).toHaveBeenCalledTimes(2);
  expect(saveAttachment).toHaveBeenLastCalledWith(intent);
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(onSaved).toHaveBeenCalledWith(committed(intent));
  expect(currentAttachment).toMatchObject({ intent: null, error: null, savedResult: committed(intent), panelOpen: false, isSaving: false });
  expect(screen.getByTestId("event-form")).toHaveTextContent(newFormId);
});

it.each([
  ["success", "replacement"], ["success", "signout"],
  ["error", "replacement"], ["error", "signout"],
])("discards target reload %s after auth %s and releases the settled attempt for the restored owner", async (outcome, change) => {
  const pending = deferred<EventData>();
  const onSaved = jest.fn();
  const initialEvent = event(ticketTypes());
  const refreshedEvent = event({ [vipId]: ticketTypes()[vipId] });
  saveAttachment.mockRejectedValueOnce(new EventFormAttachmentTargetError("Choose a current ticket type."));
  reloadEvent.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(refreshedEvent);
  const view = render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  const retainedReload = currentAttachment.reloadTargets;
  const originalAuthUser = auth.currentUser;
  Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "other-auth" } });
  await act(async () => {
    if (outcome === "success") pending.resolve(refreshedEvent);
    else pending.reject(new Error("reload failed"));
  });
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.queryByText("Form saved")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Retry (attachment|detachment)/ })).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(currentAttachment).toMatchObject({
    selectedTypeId: generalId, targetRecovery: "reload", error: "Choose a current ticket type.", savedResult: null, panelOpen: true, isReloadingTargets: false,
  });
  expect(JSON.parse(screen.getByTestId("ticket-types").textContent!)).toEqual(ticketTypes());
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  expect(reloadEvent).toHaveBeenCalledTimes(1);

  Object.assign(auth, { currentUser: originalAuthUser });
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  expect(currentAttachment.reloadTargets).toBe(retainedReload);
  fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  await waitFor(() => expect(currentAttachment.isReloadingTargets).toBe(false));
  expect(reloadEvent).toHaveBeenCalledTimes(2);
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  expect(currentAttachment).toMatchObject({ selectedTypeId: null, targetRecovery: "choose", error: null, savedResult: null, panelOpen: true });
  expect(JSON.parse(screen.getByTestId("ticket-types").textContent!)).toEqual(refreshedEvent.eventTicketTypes);
});

it.each(["save", "reload"])("allows an existing %s to finish during same-account loading while blocking new writes", async (command) => {
  const pendingSave = deferred<EventFormAttachmentResult>();
  const pendingReload = deferred<EventData>();
  const onSaved = jest.fn();
  const initialEvent = event(ticketTypes());
  const intent: EventFormAttachmentIntent = { eventId, target: { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId };
  if (command === "save") saveAttachment.mockReturnValueOnce(pendingSave.promise);
  else {
    saveAttachment.mockRejectedValueOnce(new EventFormAttachmentTargetError("Choose a current ticket type."));
    reloadEvent.mockReturnValueOnce(pendingReload.promise);
  }
  const view = render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  if (command === "reload") {
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Reload ticket types" }));
  }
  const context = jest.mocked(useUser).mock.results.at(-1)!.value;
  jest.mocked(useUser).mockReturnValue({ ...context, userLoading: true });
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  await act(async () => {
    if (command === "save") pendingSave.resolve(committed(intent));
    else pendingReload.resolve(event({ [vipId]: ticketTypes()[vipId] }));
  });
  if (command === "save") {
    expect(onSaved).toHaveBeenCalledWith(committed(intent));
    expect(screen.getByText("Form saved")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(currentAttachment.isSaving).toBe(false);
    await act(async () => { await currentAttachment.save({ ...intent, formId: oldFormId }); });
  } else {
    expect(currentAttachment).toMatchObject({ targetRecovery: "choose", error: null, isReloadingTargets: false });
    expect(JSON.parse(screen.getByTestId("ticket-types").textContent!)).toEqual({ [vipId]: ticketTypes()[vipId] });
    act(() => { currentAttachment.selectType(vipId); });
    expect(currentAttachment.targetRecovery).toBe("apply");
    await act(async () => { await currentAttachment.save(currentAttachment.intent!); });
    expect(onSaved).not.toHaveBeenCalled();
  }
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  expect(reloadEvent).toHaveBeenCalledTimes(command === "reload" ? 1 : 0);
});

it.each(["legacy", "ticket types"])("keeps a pending initial %s attachment locked across Forms remounts and reconciles success while the tab is absent", async (model) => {
  const pending = deferred<EventFormAttachmentResult>();
  const onSaved = jest.fn();
  const initialEvent = event(model === "legacy" ? undefined : ticketTypes(null), null);
  saveAttachment.mockReturnValue(pending.promise);
  loadResponses.mockRejectedValueOnce(new Error("read failed"));
  const view = render(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  fireEvent.change(await screen.findByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} showRegistration={false} />);
  expect(screen.queryByRole("combobox", { name: "Select Form" })).not.toBeInTheDocument();
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(newFormId);
  expect(screen.getByRole("combobox", { name: "Select Form" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: oldFormId } });
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  if (model === "ticket types") {
    expect(screen.getByRole("combobox", { name: "Ticket type" })).toHaveValue(generalId);
    expect(screen.getByRole("combobox", { name: "Ticket type" })).toBeDisabled();
  }
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} showRegistration={false} />);
  const result = committed({ eventId, target: model === "legacy" ? { kind: "legacyEvent" } : { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId });
  await act(async () => { pending.resolve(result); });
  expect(onSaved).toHaveBeenCalledWith(result);
  expect(screen.getByTestId("event-form")).toHaveTextContent(newFormId);
  expect(loadResponses).not.toHaveBeenCalled();
  view.rerender(<Harness initialEvent={initialEvent} onSaved={onSaved} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Form saved, but responses could not be loaded");
  expect(screen.getByText("Form saved")).toBeInTheDocument();
  expect(loadResponses).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Retry loading responses" }));
  expect(await screen.findByTestId("responses")).toHaveTextContent("new-form answer");
  expect(loadResponses).toHaveBeenCalledTimes(2);
  expect(saveAttachment).toHaveBeenCalledTimes(1);
});

it.each(["legacy", "ticket types"])("retains the failed %s target, requested choice and panel for deliberate Retry after leaving Forms", async (model) => {
  const initialEvent = event(model === "legacy" ? undefined : ticketTypes());
  const pending = deferred<EventFormAttachmentResult>();
  saveAttachment.mockReturnValueOnce(pending.promise);
  const view = render(<Harness initialEvent={initialEvent} />);
  await openChangeForm();
  fireEvent.change(screen.getByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  view.rerender(<Harness initialEvent={initialEvent} showRegistration={false} />);
  await act(async () => { pending.reject(new Error("write failed")); });
  expect(saveAttachment).toHaveBeenCalledTimes(1);
  view.rerender(<Harness initialEvent={initialEvent} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Your choice is kept");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(newFormId);
  if (model === "ticket types") {
    expect(screen.getByRole("combobox", { name: "Ticket type" })).toHaveValue(generalId);
    act(() => { replaceTypes((current) => ({
      ...current!, [generalId]: { ...current![generalId], capacity: 45, vacancy: 1 },
    })); });
  }
  fireEvent.click(screen.getByRole("button", { name: "Retry attachment" }));
  expect(await screen.findByText("Form saved")).toBeInTheDocument();
  expect(saveAttachment).toHaveBeenCalledTimes(2);
  const intent = { eventId, target: model === "legacy" ? { kind: "legacyEvent" } : { kind: "ticketType", eventTicketTypeId: generalId }, formId: newFormId };
  expect(saveAttachment).toHaveBeenNthCalledWith(1, intent);
  expect(saveAttachment).toHaveBeenNthCalledWith(2, intent);
  if (model === "ticket types") {
    expect(JSON.parse(screen.getByTestId("ticket-types").textContent!)[generalId]).toMatchObject({ capacity: 45, vacancy: 1, formId: newFormId });
  }
});

it("keeps an initial attachment choice visible on failure and deliberately retries it", async () => {
  const initialEvent = event(undefined, null);
  saveAttachment.mockRejectedValueOnce(new Error("offline"));
  render(<Harness initialEvent={initialEvent} />);
  fireEvent.change(await screen.findByRole("combobox", { name: "Select Form" }), { target: { value: newFormId } });
  expect(await screen.findByRole("alert")).toHaveTextContent("Your choice is kept");
  expect(screen.getByRole("combobox", { name: "Select Form" })).toHaveValue(newFormId);
  expect(loadResponses).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Retry attachment" }));
  expect(await screen.findByTestId("responses")).toHaveTextContent("new-form answer");
  expect(saveAttachment).toHaveBeenCalledTimes(2);
  expect(saveAttachment).toHaveBeenLastCalledWith({ eventId, target: { kind: "legacyEvent" }, formId: newFormId });
  expect(loadResponses).toHaveBeenCalledTimes(1);
});
