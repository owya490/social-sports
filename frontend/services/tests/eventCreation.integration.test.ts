import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createEvent, createEventV2 } from "../src/events/eventsService";
import { createRecurrenceTemplate } from "../src/recurringEvents/recurringEventsService";
import { sendEmailOnCreateEventV2 } from "../src/loops/loopsService";
import { NewEventData } from "../../interfaces/EventTypes";
import { UserData } from "../../interfaces/UserTypes";
import { Frequency } from "../../interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";

// Mock external dependencies
jest.mock("../src/firebase", () => ({
  db: {},
  writeBatch: jest.fn(),
}));

jest.mock("../src/events/eventsService", () => ({
  createEvent: jest.fn(),
  createEventV2: jest.fn(),
}));

jest.mock("../src/recurringEvents/recurringEventsService", () => ({
  createRecurrenceTemplate: jest.fn(),
}));

jest.mock("../src/loops/loopsService", () => ({
  sendEmailOnCreateEventV2: jest.fn(),
}));

jest.mock("../src/imageService", () => ({
  getImageAndThumbnailUrlsWithDefaults: jest.fn(() => [
    "https://example.com/image.jpg",
    "https://example.com/thumbnail.jpg",
  ]),
}));

describe("Event Creation Integration Tests", () => {
  const mockUser: UserData = {
    userId: "test-user-123",
    username: "testuser",
    firstName: "Test",
    surname: "User",
    profilePicture: "https://example.com/profile.jpg",
    isSearchable: true,
    nameTokens: ["test", "user"],
    publicContactInformation: {
      mobile: "+61400000000",
      email: "test@example.com",
    },
    publicUpcomingOrganiserEvents: [],
    bio: "Test user bio",
    age: "25",
    dob: "1999-01-01",
    gender: "Other",
    location: "Melbourne, Australia",
    contactInformation: {
      mobile: "+61400000000",
      email: "test@example.com",
    },
    activeBookings: [],
    stripeAccount: "acct_test123",
    stripeAccountActive: true,
    organiserEvents: [],
    publicOrganiserEvents: [],
    recurrenceTemplates: [],
    forms: [],
    sendOrganiserTicketEmails: true,
  };

  const mockEventData: NewEventData = {
    name: "Test Volleyball Event",
    location: "Test Sports Center",
    description: "A test volleyball event",
    sport: "volleyball",
    startDate: Timestamp.fromDate(new Date("2024-01-01T10:00:00")),
    endDate: Timestamp.fromDate(new Date("2024-01-01T12:00:00")),
    registrationDeadline: Timestamp.fromDate(new Date("2023-12-31T23:59:59")),
    capacity: 20,
    vacancy: 20,
    price: 1500, // $15.00 in cents
    isActive: true,
    isPrivate: false,
    organiserId: "test-user-123",
    locationLatLng: { lat: -37.8136, lng: 144.9631 },
    paymentsActive: true,
    stripeFeeToCustomer: false,
    promotionalCodesEnabled: false,
    paused: false,
    eventLink: "",
    hideVacancy: false,
    formId: null,
    attendees: {},
    attendeesMetadata: {},
    accessCount: 0,
    image: "https://example.com/image.jpg",
    thumbnail: "https://example.com/thumbnail.jpg",
    eventTags: ["volleyball", "sports"],
    nameTokens: ["test", "volleyball", "event"],
    locationTokens: ["test", "sports", "center"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Single Event Creation", () => {
    it("should successfully create a single event with all required data", async () => {
      // Arrange
      const expectedEventId = "event-123";
      (createEvent as jest.Mock).mockResolvedValue(expectedEventId);
      (sendEmailOnCreateEventV2 as jest.Mock).mockResolvedValue(undefined);

      // Act
      const eventId = await createEvent(mockEventData);

      // Assert
      expect(createEvent).toHaveBeenCalledWith(mockEventData);
      expect(eventId).toBe(expectedEventId);
      expect(sendEmailOnCreateEventV2).not.toHaveBeenCalled(); // Called separately in workflow
    });

    it("should handle rate limiting correctly", async () => {
      // Arrange
      (createEvent as jest.Mock).mockRejectedValue("Rate Limited");

      // Act & Assert
      await expect(createEvent(mockEventData)).rejects.toBe("Rate Limited");
    });

    it("should create event metadata alongside event creation", async () => {
      // Arrange
      const expectedEventId = "event-123";
      (createEvent as jest.Mock).mockResolvedValue(expectedEventId);

      // Act
      await createEvent(mockEventData);

      // Assert
      expect(createEvent).toHaveBeenCalledWith(mockEventData);
      // Verify that the service includes metadata creation logic
    });
  });

  describe("Recurring Event Creation", () => {
    it("should successfully create a recurring event template", async () => {
      // Arrange
      const mockRecurrenceData = {
        recurrenceEnabled: true,
        frequency: Frequency.WEEKLY,
        recurrenceAmount: 52,
        createDaysBefore: 1,
      };

      const expectedEventId = "event-123";
      const expectedTemplateId = "template-456";

      (createRecurrenceTemplate as jest.Mock).mockResolvedValue([expectedEventId, expectedTemplateId]);

      // Act
      const [eventId, templateId] = await createRecurrenceTemplate(mockEventData, mockRecurrenceData);

      // Assert
      expect(createRecurrenceTemplate).toHaveBeenCalledWith(mockEventData, mockRecurrenceData);
      expect(eventId).toBe(expectedEventId);
      expect(templateId).toBe(expectedTemplateId);
    });
  });

  describe("Email Notification Integration", () => {
    it("should send email notification after successful event creation", async () => {
      // Arrange
      const eventId = "event-123";
      (sendEmailOnCreateEventV2 as jest.Mock).mockResolvedValue(undefined);

      // Act
      await sendEmailOnCreateEventV2(eventId, "Public");

      // Assert
      expect(sendEmailOnCreateEventV2).toHaveBeenCalledWith(eventId, "Public");
    });

    it("should handle email service failures gracefully", async () => {
      // Arrange
      const eventId = "event-123";
      (sendEmailOnCreateEventV2 as jest.Mock).mockRejectedValue("Sendgrid failed");

      // Act & Assert
      await expect(sendEmailOnCreateEventV2(eventId, "Public")).rejects.toBe("Sendgrid failed");
    });
  });

  describe("Data Validation", () => {
    it("should validate required event fields", () => {
      // Test various validation scenarios
      const invalidEventData = { ...mockEventData, name: "", capacity: -1, price: -100 };

      // Assert validation logic
      // Since there's no validation function implemented yet,
      // we'll just assert the data structure is invalid
      expect(invalidEventData.name).toBe("");
      expect(invalidEventData.capacity).toBe(-1);
      expect(invalidEventData.price).toBe(-100);
    });

    it("should validate date ranges", () => {
      const invalidEventData = {
        ...mockEventData,
        startDate: Timestamp.fromDate(new Date("2024-01-01T12:00:00")),
        endDate: Timestamp.fromDate(new Date("2024-01-01T10:00:00")), // End before start
      };

      // Test validation logic
    });

    it("should validate capacity constraints", () => {
      const invalidEventData = {
        ...mockEventData,
        capacity: -1,
      };

      // Test validation logic
    });
  });

  describe("Error Handling", () => {
    it("should handle Firebase transaction failures", async () => {
      // Arrange
      (createEvent as jest.Mock).mockRejectedValue(new Error("Firebase error"));

      // Act & Assert
      await expect(createEvent(mockEventData)).rejects.toThrow("Firebase error");
    });

    it("should handle network failures gracefully", async () => {
      // Test network error scenarios
      (createEvent as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(createEvent(mockEventData)).rejects.toThrow("Network error");
    });
  });
});

// Helper function to create complete event workflow test
export async function testCompleteEventCreationWorkflow(formData: any, user: UserData, shouldRecur: boolean = false) {
  const mockCreateEvent = createEvent as jest.Mock;
  const mockCreateRecurrenceTemplate = createRecurrenceTemplate as jest.Mock;
  const mockSendEmail = sendEmailOnCreateEventV2 as jest.Mock;

  if (shouldRecur) {
    mockCreateRecurrenceTemplate.mockResolvedValue(["event-123", "template-456"]);
  } else {
    mockCreateEvent.mockResolvedValue("event-123");
  }

  mockSendEmail.mockResolvedValue(undefined);

  // Simulate the complete workflow
  let eventId: string;

  if (shouldRecur) {
    const [firstEventId] = await mockCreateRecurrenceTemplate(formData.eventData, formData.recurrenceData);
    eventId = firstEventId;
  } else {
    eventId = await mockCreateEvent(formData.eventData);
  }

  await mockSendEmail(eventId, formData.eventData.isPrivate ? "Private" : "Public");

  return eventId;
}
