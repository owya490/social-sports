import { NewEventData } from "../../../interfaces/EventTypes";
import { UserData } from "../../../interfaces/UserTypes";
import { NewRecurrenceFormData } from "../../../interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";

// Test data factories for consistent test data creation
export class TestDataFactory {
  static createMockUser(overrides: Partial<UserData> = {}): UserData {
    return {
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
      ...overrides,
    };
  }

  static createMockEventData(overrides: Partial<NewEventData> = {}): NewEventData {
    const baseDate = new Date("2024-06-01");

    return {
      name: "Test Volleyball Event",
      location: "Test Sports Center",
      description: "A comprehensive test volleyball event",
      sport: "volleyball",
      startDate: Timestamp.fromDate(new Date(baseDate.setHours(10, 0))),
      endDate: Timestamp.fromDate(new Date(baseDate.setHours(12, 0))),
      registrationDeadline: Timestamp.fromDate(new Date(baseDate.setDate(baseDate.getDate() - 1))),
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
      image: "https://example.com/test-image.jpg",
      thumbnail: "https://example.com/test-thumbnail.jpg",
      eventTags: ["volleyball", "sports", "test"],
      nameTokens: ["test", "volleyball", "event"],
      locationTokens: ["test", "sports", "center"],
      ...overrides,
    };
  }

  static createMockRecurrenceData(overrides: Partial<NewRecurrenceFormData> = {}): NewRecurrenceFormData {
    return {
      recurrenceEnabled: true,
      frequency: "WEEKLY" as any,
      recurrenceAmount: 52,
      createDaysBefore: 1,
      ...overrides,
    };
  }

  static createFormData(
    eventOverrides: Partial<NewEventData> = {},
    recurrenceOverrides: Partial<NewRecurrenceFormData> = {}
  ) {
    const eventData = this.createMockEventData(eventOverrides);
    const recurrenceData = this.createMockRecurrenceData(recurrenceOverrides);

    return {
      // Convert NewEventData to FormData structure
      name: eventData.name,
      location: eventData.location,
      description: eventData.description,
      sport: eventData.sport,
      startDate: eventData.startDate.toDate().toISOString().slice(0, 10),
      endDate: eventData.endDate.toDate().toISOString().slice(0, 10),
      registrationEndDate: eventData.registrationDeadline.toDate().toISOString().slice(0, 10),
      startTime: "10:00",
      endTime: "12:00",
      registrationEndTime: "23:59",
      capacity: eventData.capacity,
      price: eventData.price,
      isPrivate: eventData.isPrivate,
      paymentsActive: eventData.paymentsActive,
      lat: eventData.locationLatLng.lat,
      lng: eventData.locationLatLng.lng,
      stripeFeeToCustomer: eventData.stripeFeeToCustomer,
      promotionalCodesEnabled: eventData.promotionalCodesEnabled,
      paused: eventData.paused,
      eventLink: eventData.eventLink,
      hideVacancy: eventData.hideVacancy,
      formId: eventData.formId,
      image: eventData.image,
      thumbnail: eventData.thumbnail,
      tags: eventData.eventTags,
      newRecurrenceData: recurrenceData,
    };
  }
}

// Mock Firebase services
export class FirebaseMocks {
  static mockFirestore() {
    return {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };
  }

  static mockWriteBatch() {
    return {
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
  }

  static mockTransaction() {
    return {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      }),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }
}

// API Response Mocks
export class APIResponseMocks {
  static createEventSuccess(eventId: string = "test-event-123") {
    return {
      data: JSON.stringify({ eventId }),
    };
  }

  static createRecurrenceTemplateSuccess(eventId: string = "test-event-123", templateId: string = "test-template-456") {
    return [eventId, templateId];
  }

  static emailServiceSuccess() {
    return Promise.resolve(undefined);
  }

  static rateLimitError() {
    return Promise.reject("Rate Limited");
  }

  static firebaseError() {
    return Promise.reject(new Error("Firebase transaction failed"));
  }

  static networkError() {
    return Promise.reject(new Error("Network error"));
  }

  static sendgridError() {
    return Promise.reject("Sendgrid failed");
  }
}

// Test assertions helpers
export class TestAssertions {
  static assertEventDataStructure(eventData: any) {
    expect(eventData).toHaveProperty("name");
    expect(eventData).toHaveProperty("location");
    expect(eventData).toHaveProperty("capacity");
    expect(eventData).toHaveProperty("price");
    expect(eventData).toHaveProperty("organiserId");
    expect(eventData).toHaveProperty("startDate");
    expect(eventData).toHaveProperty("endDate");
    expect(eventData).toHaveProperty("registrationDeadline");
    expect(eventData).toHaveProperty("locationLatLng");
    expect(eventData.locationLatLng).toHaveProperty("lat");
    expect(eventData.locationLatLng).toHaveProperty("lng");
  }

  static assertRecurrenceDataStructure(recurrenceData: any) {
    expect(recurrenceData).toHaveProperty("frequency");
    expect(recurrenceData).toHaveProperty("interval");
    expect(recurrenceData).toHaveProperty("endDate");
  }

  static assertTokenization(eventData: any) {
    expect(eventData).toHaveProperty("nameTokens");
    expect(eventData).toHaveProperty("locationTokens");
    expect(Array.isArray(eventData.nameTokens)).toBe(true);
    expect(Array.isArray(eventData.locationTokens)).toBe(true);
    expect(eventData.nameTokens.length).toBeGreaterThan(0);
    expect(eventData.locationTokens.length).toBeGreaterThan(0);
  }

  static assertEmailNotificationCall(mockEmailService: jest.Mock, eventId: string, eventType: string) {
    expect(mockEmailService).toHaveBeenCalledWith(eventId, eventType);
  }

  static assertDatabaseOperations(mockBatch: any, expectedOperations: string[]) {
    expectedOperations.forEach((operation) => {
      expect(mockBatch[operation]).toHaveBeenCalled();
    });
  }
}

// Integration test workflow helpers
export class IntegrationTestHelpers {
  static async simulateCompleteEventCreation(
    eventData: NewEventData,
    user: UserData,
    mocks: {
      createEvent?: jest.Mock;
      createRecurrenceTemplate?: jest.Mock;
      sendEmail?: jest.Mock;
    }
  ) {
    const { createEvent, createRecurrenceTemplate, sendEmail } = mocks;

    // Simulate the workflow
    let eventId: string;

    if (createRecurrenceTemplate) {
      const [firstEventId] = await createRecurrenceTemplate(eventData, {});
      eventId = firstEventId;
    } else if (createEvent) {
      eventId = await createEvent(eventData);
    } else {
      throw new Error("No creation method provided");
    }

    if (sendEmail) {
      await sendEmail(eventId, eventData.isPrivate ? "Private" : "Public");
    }

    return eventId;
  }

  static validateEventCreationFlow(mocks: any, eventData: NewEventData) {
    // Validate that all required operations were called in correct order
    TestAssertions.assertEventDataStructure(eventData);

    if (mocks.createEvent) {
      expect(mocks.createEvent).toHaveBeenCalledWith(eventData);
    }

    if (mocks.sendEmail) {
      expect(mocks.sendEmail).toHaveBeenCalled();
    }
  }
}

// Environment setup helpers
export class TestEnvironment {
  static setupFirebaseMocks() {
    jest.mock("firebase/firestore", () => ({
      collection: jest.fn(),
      doc: jest.fn(),
      writeBatch: jest.fn(() => FirebaseMocks.mockWriteBatch()),
      runTransaction: jest.fn(),
      Timestamp: {
        fromDate: (date: Date) => ({ toDate: () => date }),
        now: () => ({ toDate: () => new Date() }),
      },
    }));
  }

  static setupAPIServiceMocks() {
    jest.mock("../src/loops/loopsService", () => ({
      sendEmailOnCreateEventV2: jest.fn(),
    }));

    jest.mock("../src/imageService", () => ({
      getImageAndThumbnailUrlsWithDefaults: jest.fn(() => [
        "https://example.com/image.jpg",
        "https://example.com/thumbnail.jpg",
      ]),
    }));
  }

  static cleanupMocks() {
    jest.clearAllMocks();
    jest.resetAllMocks();
  }
}
