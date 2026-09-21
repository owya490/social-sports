import { NewEventData } from "@/interfaces/EventTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Frequency, NewRecurrenceFormData, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { EventId } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";
import { executeGlobalAppControllerFunction } from "../src/functions/functionsUtils";
import { createRecurrenceTemplate, updateRecurrenceTemplate } from "../src/recurringEvents/recurringEventsService";

jest.mock("../src/functions/functionsUtils", () => ({
  executeGlobalAppControllerFunction: jest.fn(),
}));

jest.mock("../src/users/usersService", () => ({
  getPrivateUserById: jest.fn(),
}));

jest.mock("../src/recurringEvents/recurringEventsUtils", () => ({
  findRecurrenceTemplateDoc: jest.fn(),
}));

const executeGac = executeGlobalAppControllerFunction as jest.MockedFunction<
  typeof executeGlobalAppControllerFunction
>;

describe("recurringEventsService GAC calls", () => {
  const date = Timestamp.fromDate(new Date("2026-09-21T10:00:00.000Z"));
  const eventData = {
    organiserId: "organiser-1",
    startDate: date,
    endDate: date,
    registrationDeadline: date,
  } as NewEventData;
  const recurrenceData: NewRecurrenceFormData = {
    frequency: Frequency.WEEKLY,
    recurrenceAmount: 2,
    createDaysBefore: 3,
    recurrenceEnabled: true,
  };

  beforeEach(() => {
    executeGac.mockReset();
  });

  it("creates a recurrence template through the authenticated GAC endpoint", async () => {
    executeGac.mockResolvedValue({
      eventId: "event-1" as EventId,
      recurrenceTemplateId: "template-1" as RecurrenceTemplateId,
    });

    await expect(createRecurrenceTemplate(eventData, recurrenceData)).resolves.toEqual(["event-1", "template-1"]);
    expect(executeGac).toHaveBeenCalledWith(
      EndpointType.CREATE_RECURRENCE_TEMPLATE,
      expect.objectContaining({ eventData: expect.objectContaining({ organiserId: "organiser-1" }), recurrenceData }),
      { attachAuth: true }
    );
  });

  it("updates a recurrence template through the authenticated GAC endpoint", async () => {
    executeGac.mockResolvedValue({ recurrenceTemplateId: "template-1" as RecurrenceTemplateId });

    await expect(
      updateRecurrenceTemplate("template-1" as RecurrenceTemplateId, { recurrenceData })
    ).resolves.toBe("template-1");
    expect(executeGac).toHaveBeenCalledWith(
      EndpointType.UPDATE_RECURRENCE_TEMPLATE,
      { recurrenceTemplateId: "template-1", eventData: null, recurrenceData },
      { attachAuth: true }
    );
  });
});
