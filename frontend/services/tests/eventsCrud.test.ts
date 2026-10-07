import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { DocumentReference, Timestamp, Transaction, doc, getDoc, runTransaction, updateDoc } from "firebase/firestore";
import { EVENT_PATHS } from "../src/events/eventsConstants";
import { auth, db } from "../src/firebase";
import { updateEventById, updateEventFromDocRef } from "../src/events/eventsService";
import { findEventDocRef } from "../src/events/eventsUtils/commonEventsUtils";
import { EventDateUpdateError } from "../src/events/eventsUtils/eventDateUpdates";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  doc: jest.fn(), getDoc: jest.fn(), runTransaction: jest.fn(), updateDoc: jest.fn(),
}));
jest.mock("../src/firebase", () => ({ db: {}, auth: { currentUser: { uid: "owner-1" } } }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })),
}));
jest.mock("../src/firebaseFunctionsService", () => ({}));
jest.mock("../src/users/usersService", () => ({}));
jest.mock("../src/users/usersUtils/getUsersUtils", () => ({}));
jest.mock("../src/events/eventsMetadata/eventsMetadataUtils/getEventsMetadataUtils", () => ({}));
jest.mock("../src/events/eventsUtils/createEventsUtils", () => ({}));
jest.mock("../src/events/eventsUtils/getEventsUtils", () => ({}));
jest.mock("../src/events/eventsUtils/commonEventsUtils", () => ({ findEventDocRef: jest.fn() }));

describe("event date updates", () => {
  const eventId = "event-1" as EventId;
  const now = Timestamp.fromDate(new Date("2026-10-06T04:00:00Z"));
  const at = (offset: number) => new Timestamp(now.seconds + offset * 3600, 0);
  const path = (collection: string) => `${collection}/${eventId}`;
  const records = new Map<string, EventData>();
  const transactionGet = jest.fn();
  const transactionUpdate = jest.fn();
  const pendingUpdates: Array<{ ref: DocumentReference; patch: Partial<EventData> }> = [];
  const transaction = { get: transactionGet, update: transactionUpdate } as unknown as Transaction;

  function reference(documentPath: string): DocumentReference {
    return {
      id: eventId, path: documentPath, firestore: db,
      parent: { path: documentPath.slice(0, documentPath.lastIndexOf("/")) },
    } as DocumentReference;
  }

  function snapshot(ref: DocumentReference) {
    const data = records.get(ref.path);
    return { ref, exists: () => data !== undefined, data: () => data };
  }

  function seed(collection = EVENT_PATHS[0], overrides: Partial<EventData> = {}) {
    const data = {
      ...EmptyEventData, eventId, organiserId: "owner-1" as EventData["organiserId"],
      isActive: true, isPrivate: collection.endsWith("Private"),
      startDate: at(1), endDate: at(3), registrationDeadline: at(1), vacancy: 5, capacity: 14,
      ...overrides,
    };
    records.set(path(collection), data);
    return data;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    records.clear();
    pendingUpdates.length = 0;
    jest.spyOn(Timestamp, "now").mockReturnValue(now);
    jest.mocked(doc).mockImplementation((_db, ...segments) => reference(segments.join("/")));
    transactionGet.mockImplementation((ref: DocumentReference) => Promise.resolve(snapshot(ref)));
    transactionUpdate.mockImplementation((ref: DocumentReference, patch: Partial<EventData>) => {
      pendingUpdates.push({ ref, patch });
    });
    jest.mocked(runTransaction).mockImplementation(async (_db, callback) => {
      const result = await callback(transaction);
      for (const { ref, patch } of pendingUpdates) {
        records.set(ref.path, { ...records.get(ref.path)!, ...patch });
      }
      return result;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it.each(EVENT_PATHS.slice(0, 2))("updates future dates in %s without replacing inventory", async (collection) => {
    const current = seed(collection);
    await updateEventById(eventId, { endDate: at(4), name: "Updated" });
    expect(records.get(path(collection))).toEqual({ ...current, endDate: at(4), name: "Updated" });
    expect(transactionUpdate.mock.calls[0][1]).toEqual({ endDate: at(4), name: "Updated" });
    expect(transactionGet.mock.calls.map(([ref]) => ref.path)).toEqual(EVENT_PATHS.map(path));
    expect(findEventDocRef).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it.each([
    [EVENT_PATHS[0], { endDate: at(-1) }, "ended"],
    [EVENT_PATHS[2], { isActive: false }, "inactive"],
    [EVENT_PATHS[2], { isActive: true }, "inactive"],
    [EVENT_PATHS[0], { isActive: false }, "inactive"],
  ] as const)("rejects unavailable source %s %o", async (collection, overrides, reason) => {
    const current = seed(collection, overrides);
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow(reason);
    expect(records.get(path(collection))).toEqual(current);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("allows unchanged expired dates alongside a settings update", async () => {
    const current = seed(EVENT_PATHS[2], { isActive: false, endDate: at(-1) });
    await updateEventById(eventId, { endDate: new Timestamp(current.endDate.seconds, 0), paused: true });
    expect(records.get(path(EVENT_PATHS[2]))).toEqual({ ...current, paused: true });
  });

  it.each([
    { endDate: at(-1) }, { startDate: at(5) }, { registrationDeadline: at(5) },
    { endDate: null }, { endDate: undefined },
    { endDate: at(4), isActive: false }, { endDate: at(4), isPrivate: true },
  ])("rejects invalid date patch %o without writes", async (patch) => {
    seed();
    await expect(updateEventById(eventId, patch as Partial<EventData>)).rejects.toBeInstanceOf(EventDateUpdateError);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("allows an ongoing event and a deliberately closed registration deadline", async () => {
    seed();
    await updateEventById(eventId, { startDate: at(-1), registrationDeadline: at(-2), endDate: now });
    expect(records.get(path(EVENT_PATHS[0]))).toMatchObject({ startDate: at(-1), registrationDeadline: at(-2), endDate: now });
  });

  it("rereads partitions after an archive causes a transaction retry", async () => {
    const current = seed();
    jest.mocked(runTransaction).mockImplementation(async (_db, callback) => {
      await callback(transaction);
      pendingUpdates.length = 0;
      records.delete(path(EVENT_PATHS[0]));
      records.set(path(EVENT_PATHS[2]), { ...current, isActive: false });
      transactionUpdate.mockClear();
      return callback(transaction);
    });
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow("inactive");
    expect(transactionGet).toHaveBeenCalledTimes(8);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(records.get(path(EVENT_PATHS[2]))).toEqual({ ...current, isActive: false });
  });

  it("rejects missing or duplicate partitions instead of selecting the first copy", async () => {
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow("uniquely located");
    seed(); seed(EVENT_PATHS[2], { isActive: false });
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow("uniquely located");
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it.each([
    [EVENT_PATHS[0], EVENT_PATHS[1]],
    [EVENT_PATHS[0], EVENT_PATHS[2]],
    [EVENT_PATHS[1], EVENT_PATHS[0]],
  ])("ignores other organisers' copies when saving %s with a duplicate in %s", async (ownedPath, foreignPath) => {
    const current = seed(ownedPath);
    const foreign = seed(foreignPath, { organiserId: "attacker" as EventData["organiserId"] });
    await updateEventById(eventId, { endDate: at(4) });
    expect(records.get(path(ownedPath))).toEqual({ ...current, endDate: at(4) });
    expect(records.get(path(foreignPath))).toEqual(foreign);
  });

  it("requires a signed-in organiser before starting a date transaction", async () => {
    seed();
    jest.replaceProperty(auth, "currentUser", null);
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow("Sign in");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("cannot update a record belonging to another organiser", async () => {
    const current = seed(EVENT_PATHS[0], { organiserId: "attacker" as EventData["organiserId"] });
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toBeInstanceOf(EventDateUpdateError);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(records.get(path(EVENT_PATHS[0]))).toEqual(current);
  });

  it("does not use a foreign active copy to extend an owned inactive event", async () => {
    seed(EVENT_PATHS[0], { organiserId: "attacker" as EventData["organiserId"] });
    seed(EVENT_PATHS[2], { isActive: false });
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toThrow("inactive");
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("propagates a partition read failure rather than ignoring it", async () => {
    seed();
    const failure = new Error("permission-denied");
    transactionGet.mockRejectedValueOnce(failure);
    await expect(updateEventById(eventId, { endDate: at(4) })).rejects.toBe(failure);
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("applies the same guard to updates from a document reference", async () => {
    seed(EVENT_PATHS[2], { isActive: false });
    await expect(updateEventFromDocRef(reference(path(EVENT_PATHS[2])), { endDate: at(4) })).rejects.toThrow("inactive");
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("does not retarget an explicit document reference after a move", async () => {
    seed(EVENT_PATHS[1]);
    await expect(updateEventFromDocRef(reference(path(EVENT_PATHS[0])), { endDate: at(4) })).rejects.toThrow("moved");
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects a foreign database reference before starting a transaction", async () => {
    seed();
    const ref = { ...reference(path(EVENT_PATHS[0])), firestore: {} } as DocumentReference;
    await expect(updateEventFromDocRef(ref, { endDate: at(4) })).rejects.toThrow("different database");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("preserves the canonical full ticket-map update when dates and inventory are saved together", async () => {
    seed();
    const eventTicketTypes = {
      "ticket-1": { id: "ticket-1", name: "General Admission", price: 1350, capacity: 14, vacancy: 4 },
    } as EventData["eventTicketTypes"];
    await updateEventById(eventId, { endDate: at(4), eventTicketTypes, capacity: 14, vacancy: 4 });
    expect(transactionUpdate.mock.calls[0][1]).toEqual({ endDate: at(4), eventTicketTypes, capacity: 14, vacancy: 4 });
  });

  it("uses the same full ticket-map preservation for reference-based updates without dates", async () => {
    const eventTicketTypes = {
      "ticket-1": { id: "ticket-1", name: "General Admission", price: 1350, capacity: 14, vacancy: 5 },
    } as EventData["eventTicketTypes"];
    seed(EVENT_PATHS[0], { eventTicketTypes });
    const ref = reference(path(EVENT_PATHS[0]));
    jest.mocked(getDoc).mockResolvedValue(snapshot(ref) as Awaited<ReturnType<typeof getDoc>>);
    await updateEventFromDocRef(ref, { eventTicketTypes, capacity: 14, vacancy: 5 });
    expect(updateDoc).toHaveBeenCalledWith(ref, { eventTicketTypes, capacity: 14, vacancy: 5 });
  });

  it("keeps settings-only updates on the existing nontransactional path", async () => {
    seed(EVENT_PATHS[2], { isActive: false });
    const ref = reference(path(EVENT_PATHS[2]));
    jest.mocked(findEventDocRef).mockResolvedValue(ref);
    jest.mocked(getDoc).mockResolvedValue(snapshot(ref) as Awaited<ReturnType<typeof getDoc>>);
    await updateEventById(eventId, { paused: true });
    expect(updateDoc).toHaveBeenCalledWith(ref, { paused: true });
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
