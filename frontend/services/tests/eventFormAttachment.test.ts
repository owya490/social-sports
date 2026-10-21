import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventDataWithoutOrganiser, EventFormAttachmentIntent, EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { DocumentReference, FieldPath, runTransaction, Transaction } from "firebase/firestore";
import { EventFormAttachmentTargetError, updateEventFormAttachment } from "../src/events/eventsService";
import { findEventDocRef } from "../src/events/eventsUtils/commonEventsUtils";
import { GENERAL_TICKET_TYPE_NAME } from "../src/events/eventsUtils/eventTicketTypesUtils";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  runTransaction: jest.fn(),
}));

jest.mock("../src/firebase", () => ({ db: {} }));
jest.mock("../src/firebaseFunctionsService", () => ({}));
jest.mock("../src/users/usersService", () => ({}));
jest.mock("../src/events/eventsUtils/commonEventsUtils", () => ({ findEventDocRef: jest.fn() }));

const runTransactionMock = runTransaction as jest.MockedFunction<typeof runTransaction>;
const findEventDocRefMock = findEventDocRef as jest.MockedFunction<typeof findEventDocRef>;

describe("updateEventFormAttachment", () => {
  const eventId = "event-1" as EventId;
  const typeId = "selected.type" as EventTicketTypeId;
  const siblingId = "sibling" as EventTicketTypeId;
  const formId = "requested-form" as FormId;
  const eventRef = { id: eventId } as unknown as DocumentReference;
  const intent: EventFormAttachmentIntent = {
    eventId,
    target: { kind: "ticketType", eventTicketTypeId: typeId },
    formId,
  };
  const transaction = { get: jest.fn(), update: jest.fn() };
  let stored: Pick<EventDataWithoutOrganiser, "eventTicketTypes" | "formId" | "price" | "capacity" | "vacancy">;

  beforeEach(() => {
    jest.clearAllMocks();
    runTransactionMock.mockReset();
    stored = {
      formId: "previous-event-form" as FormId,
      price: 10,
      capacity: 20,
      vacancy: 7,
      eventTicketTypes: {
        [typeId]: { id: typeId, name: "VIP", price: 25, capacity: 10, vacancy: 4, formId: null },
        [siblingId]: { id: siblingId, name: "Standard", price: 10, capacity: 20, vacancy: 7, formId: null },
      },
    };
    findEventDocRefMock.mockResolvedValue(eventRef);
    transaction.get.mockImplementation(async () => ({ exists: () => true, data: () => stored }));
    runTransactionMock.mockImplementation(async (_db, operation) =>
      operation(transaction as unknown as Transaction)
    );
  });

  it("patches only the literal target form field on initial save and retry after inventory changes", async () => {
    runTransactionMock.mockImplementationOnce(async (_db, operation) => {
      await operation(transaction as unknown as Transaction);
      throw new Error("Commit unavailable");
    });

    await expect(updateEventFormAttachment(intent)).rejects.toThrow("Commit unavailable");
    stored.eventTicketTypes![typeId] = { ...stored.eventTicketTypes![typeId], vacancy: 2, capacity: 12 };
    stored.eventTicketTypes![siblingId] = {
      ...stored.eventTicketTypes![siblingId],
      price: 15,
      vacancy: 3,
      formId: "sibling-form" as FormId,
    };
    stored.vacancy = 3;
    const latest = structuredClone(stored);

    await expect(updateEventFormAttachment(intent)).resolves.toEqual({
      ...intent,
      target: { ...intent.target, ticketTypeName: "VIP" },
      eventFormIdUpdated: false,
    });

    expect(findEventDocRefMock).toHaveBeenNthCalledWith(1, eventId);
    expect(findEventDocRefMock).toHaveBeenNthCalledWith(2, eventId);
    expect(transaction.get).toHaveBeenCalledTimes(2);
    expect(transaction.get).toHaveBeenCalledWith(eventRef);
    expect(transaction.update).toHaveBeenCalledTimes(2);
    for (const call of transaction.update.mock.calls) {
      expect(call).toEqual([eventRef, new FieldPath("eventTicketTypes", typeId, "formId"), formId]);
    }
    expect(stored).toEqual(latest);
  });

  it.each([
    { from: GENERAL_TICKET_TYPE_NAME, to: "VIP", syncEventFormId: false, requestedFormId: null },
    { from: "VIP", to: GENERAL_TICKET_TYPE_NAME, syncEventFormId: true, requestedFormId: formId },
  ])("revalidates a rename from $from to $to when the transaction retries", async ({ from, to, syncEventFormId, requestedFormId }) => {
    stored.eventTicketTypes![typeId].name = from;
    runTransactionMock.mockImplementationOnce(async (_db, operation) => {
      await operation(transaction as unknown as Transaction);
      stored.eventTicketTypes![typeId] = { ...stored.eventTicketTypes![typeId], name: to };
      return operation(transaction as unknown as Transaction);
    });

    await expect(updateEventFormAttachment({ ...intent, formId: requestedFormId })).resolves.toEqual({
      ...intent,
      formId: requestedFormId,
      target: { ...intent.target, ticketTypeName: to },
      eventFormIdUpdated: syncEventFormId,
    });

    expect(transaction.get).toHaveBeenCalledTimes(2);
    expect(transaction.update).toHaveBeenCalledTimes(2);
    const expected = [eventRef, new FieldPath("eventTicketTypes", typeId, "formId"), requestedFormId];
    expect(transaction.update).toHaveBeenLastCalledWith(
      ...expected,
      ...(syncEventFormId ? [new FieldPath("formId"), requestedFormId] : [])
    );
  });

  it("does not apply the single non-General inventory fallback to form attachments", async () => {
    delete stored.eventTicketTypes![siblingId];

    await expect(updateEventFormAttachment(intent)).resolves.toEqual({
      ...intent,
      target: { ...intent.target, ticketTypeName: "VIP" },
      eventFormIdUpdated: false,
    });

    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith(
      eventRef,
      new FieldPath("eventTicketTypes", typeId, "formId"),
      formId
    );
  });

  it("rejects a target deleted before deliberate retry without recreating it", async () => {
    runTransactionMock.mockRejectedValueOnce(new Error("Commit unavailable"));
    await expect(updateEventFormAttachment(intent)).rejects.toThrow("Commit unavailable");
    delete stored.eventTicketTypes![typeId];

    await expect(updateEventFormAttachment(intent)).rejects.toThrow(EventFormAttachmentTargetError);

    expect(transaction.update).not.toHaveBeenCalled();
    expect(stored.eventTicketTypes![typeId]).toBeUndefined();
  });

  it("revalidates deletion when Firestore reruns the transaction callback", async () => {
    runTransactionMock.mockImplementationOnce(async (_db, operation) => {
      await operation(transaction as unknown as Transaction);
      delete stored.eventTicketTypes![typeId];
      return operation(transaction as unknown as Transaction);
    });

    await expect(updateEventFormAttachment(intent)).rejects.toThrow("Choose a current ticket type");

    expect(transaction.get).toHaveBeenCalledTimes(2);
    expect(transaction.update).toHaveBeenCalledTimes(1);
  });

  it("atomically detaches both form fields for authoritative General Admission", async () => {
    stored.eventTicketTypes![typeId].name = GENERAL_TICKET_TYPE_NAME;

    await expect(updateEventFormAttachment({ ...intent, formId: null })).resolves.toEqual({
      ...intent,
      target: { ...intent.target, ticketTypeName: GENERAL_TICKET_TYPE_NAME },
      formId: null,
      eventFormIdUpdated: true,
    });

    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith(
      eventRef,
      new FieldPath("eventTicketTypes", typeId, "formId"),
      null,
      new FieldPath("formId"),
      null
    );
  });

  it.each([
    { requestedFormId: formId, eventTicketTypes: undefined },
    { requestedFormId: null, eventTicketTypes: {} },
  ])("preserves event-level legacy attachment behavior for $requestedFormId", async ({ requestedFormId, eventTicketTypes }) => {
    stored.eventTicketTypes = eventTicketTypes;
    const legacyIntent: EventFormAttachmentIntent = {
      eventId,
      target: { kind: "legacyEvent" },
      formId: requestedFormId,
    };

    await expect(updateEventFormAttachment(legacyIntent)).resolves.toEqual({
      ...legacyIntent,
      eventFormIdUpdated: true,
    });

    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith(eventRef, new FieldPath("formId"), requestedFormId);
  });

  it("rejects a legacy target converted to ticket types", async () => {
    await expect(
      updateEventFormAttachment({ eventId, target: { kind: "legacyEvent" }, formId })
    ).rejects.toThrow("This event now uses ticket types. Choose a current ticket type");

    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("rejects an event removed after its reference was found", async () => {
    transaction.get.mockResolvedValueOnce({ exists: () => false });

    await expect(updateEventFormAttachment(intent)).rejects.toThrow("not found");

    expect(transaction.update).not.toHaveBeenCalled();
  });
});
