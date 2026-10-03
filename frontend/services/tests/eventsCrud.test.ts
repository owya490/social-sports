jest.mock("@/services/src/firebase", () => ({ db: {} }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
}));
jest.mock("@/services/src/firebaseFunctionsService", () => ({
  FIREBASE_FUNCTIONS_CREATE_EVENT: "create_event",
  getFirebaseFunctionByName: jest.fn(),
}));
jest.mock("@/services/src/functions/functionsUtils", () => ({
  executeGlobalAppControllerFunction: jest.fn(),
}));
jest.mock("@/services/src/events/eventsUtils/createEventsUtils", () => ({
  rateLimitCreateEvents: jest.fn(),
}));
jest.mock("@/services/src/events/eventsUtils/getEventsUtils", () => ({
  bustEventsLocalStorageCache: jest.fn(),
  findEventDoc: jest.fn(),
  getAllEventsFromCollectionRef: jest.fn(),
  tryGetAllActivePublicEventsFromLocalStorage: jest.fn(),
}));
jest.mock("@/services/src/users/usersUtils/getUsersUtils", () => ({
  bustUserLocalStorageCache: jest.fn(),
}));

import { EmptyEventData, EventId, NewEventData } from "@/interfaces/EventTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Timestamp } from "firebase/firestore";
import { createEvent } from "../src/events/eventsService";
import { rateLimitCreateEvents } from "../src/events/eventsUtils/createEventsUtils";
import { bustEventsLocalStorageCache } from "../src/events/eventsUtils/getEventsUtils";
import { executeGlobalAppControllerFunction } from "../src/functions/functionsUtils";
import { bustUserLocalStorageCache } from "../src/users/usersUtils/getUsersUtils";

const mockExecuteGlobalAppControllerFunction = executeGlobalAppControllerFunction as jest.MockedFunction<
  typeof executeGlobalAppControllerFunction
>;
const mockRateLimitCreateEvents = rateLimitCreateEvents as jest.MockedFunction<typeof rateLimitCreateEvents>;
const mockBustEventsLocalStorageCache = bustEventsLocalStorageCache as jest.MockedFunction<
  typeof bustEventsLocalStorageCache
>;
const mockBustUserLocalStorageCache = bustUserLocalStorageCache as jest.MockedFunction<typeof bustUserLocalStorageCache>;

function newEventData(): NewEventData {
  return {
    ...EmptyEventData,
    organiserId: "organiser-1" as NewEventData["organiserId"],
    name: "Saturday social",
    startDate: Timestamp.fromDate(new Date("2026-09-20T09:00:00Z")),
    endDate: Timestamp.fromDate(new Date("2026-09-20T11:00:00Z")),
    registrationDeadline: Timestamp.fromDate(new Date("2026-09-19T09:00:00Z")),
  };
}

describe("createEvent", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRateLimitCreateEvents.mockReturnValue(true);
  });

  it("creates through the authenticated GAC endpoint and serializes timestamps as dates", async () => {
    const data = newEventData();
    const eventId = "event_123" as EventId;
    mockExecuteGlobalAppControllerFunction.mockResolvedValue({ eventId });

    await expect(createEvent(data)).resolves.toBe(eventId);

    expect(mockExecuteGlobalAppControllerFunction).toHaveBeenCalledWith(
      EndpointType.CREATE_EVENT,
      expect.objectContaining({
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        registrationDeadline: data.registrationDeadline.toDate(),
      }),
      { attachAuth: true }
    );
    expect(mockBustEventsLocalStorageCache).toHaveBeenCalledTimes(1);
    expect(mockBustUserLocalStorageCache).toHaveBeenCalledTimes(1);
  });

  it("does not clear caches when event creation fails", async () => {
    const error = new Error("request failed");
    mockExecuteGlobalAppControllerFunction.mockRejectedValue(error);

    await expect(createEvent(newEventData())).rejects.toThrow(error);

    expect(mockBustEventsLocalStorageCache).not.toHaveBeenCalled();
    expect(mockBustUserLocalStorageCache).not.toHaveBeenCalled();
  });
});
