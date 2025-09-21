/// <reference types="cypress" />

// Custom commands for event creation testing

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsTestUser(): Chainable<void>;
      fillBasicEventInfo(eventData: any): Chainable<void>;
      fillCompleteEventForm(): Chainable<void>;
      cleanupTestEvents(): Chainable<void>;
      createTestEvent(eventData?: any): Chainable<string>;
      waitForElementToBeVisible(selector: string, timeout?: number): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add("loginAsTestUser", () => {
  cy.visit("/login");
  cy.get('[data-testid="email-input"]').type(Cypress.env("TEST_USER_EMAIL") || "test@example.com");
  cy.get('[data-testid="password-input"]').type(Cypress.env("TEST_USER_PASSWORD") || "testpassword123");
  cy.get('[data-testid="login-button"]').click();
  cy.url().should("include", "/dashboard");
  cy.wait(1000); // Wait for login to complete
});

// Fill basic event information
Cypress.Commands.add("fillBasicEventInfo", (eventData) => {
  cy.get('[data-testid="event-name-input"]').clear().type(eventData.name);
  cy.get('[data-testid="location-autocomplete"]').clear().type(eventData.location);

  // Handle sport selection
  cy.get('[data-testid="sport-select"]').click();
  cy.get(`[data-testid="sport-${eventData.sport}"]`).click();

  // Set dates and times
  if (eventData.startDate) {
    cy.get('[data-testid="start-date-input"]').clear().type(eventData.startDate);
  }
  if (eventData.startTime) {
    cy.get('[data-testid="start-time-input"]').clear().type(eventData.startTime);
  }
  if (eventData.endTime) {
    cy.get('[data-testid="end-time-input"]').clear().type(eventData.endTime);
  }

  // Set price and capacity
  cy.get('[data-testid="price-input"]').clear().type(eventData.price);
  cy.get('[data-testid="capacity-input"]').clear().type(eventData.capacity);

  // Set privacy
  if (eventData.isPrivate !== undefined) {
    const privacyOption = eventData.isPrivate ? "private" : "public";
    cy.get(`[data-testid="privacy-${privacyOption}"]`).click();
  }
});

// Fill complete event form
Cypress.Commands.add("fillCompleteEventForm", () => {
  const defaultEventData = {
    name: "Complete E2E Test Event",
    location: "Complete Test Center",
    sport: "volleyball",
    price: "30.00",
    capacity: "25",
    startDate: "2024-06-01",
    startTime: "10:00",
    endTime: "12:00",
    isPrivate: false,
  };

  // Step 1: Basic Information
  cy.fillBasicEventInfo(defaultEventData);
  cy.get('[data-testid="next-step-button"]').click();

  // Step 2: Images (skip for speed)
  cy.get('[data-testid="next-step-button"]').click();

  // Step 3: Description
  cy.get('[data-testid="description-editor"]').type("Complete test event description for E2E testing.");
  cy.get('[data-testid="next-step-button"]').click();

  // Step 4: Preview (ready to create)
});

// Cleanup test events
Cypress.Commands.add("cleanupTestEvents", () => {
  cy.request({
    method: "DELETE",
    url: "/api/test/cleanup-events",
    headers: {
      "Content-Type": "application/json",
    },
    failOnStatusCode: false,
  }).then((response) => {
    cy.log(`Cleanup response: ${response.status}`);
  });
});

// Create a test event programmatically
Cypress.Commands.add("createTestEvent", (eventData = {}) => {
  const defaultData = {
    name: "Cypress Test Event",
    location: "Test Location",
    sport: "volleyball",
    capacity: 20,
    price: 1500, // $15.00 in cents
    isPrivate: false,
    ...eventData,
  };

  return cy
    .request({
      method: "POST",
      url: "/api/events/create",
      body: { eventData: defaultData },
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return response.body.eventId;
    });
});

// Wait for element to be visible with custom timeout
Cypress.Commands.add("waitForElementToBeVisible", (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should("be.visible");
});
