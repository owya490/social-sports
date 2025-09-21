// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global setup for E2E tests
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();
  cy.clearCookies();

  // Setup viewport
  cy.viewport(1280, 720);

  // Intercept common API calls
  cy.intercept("GET", "**/api/user/**", { fixture: "user.json" }).as("getUser");
  cy.intercept("GET", "**/api/events/**", { fixture: "events.json" }).as("getEvents");
});

// Global error handling
Cypress.on("uncaught:exception", (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that we expect in our application (like React warnings)
  if (err.message.includes("ResizeObserver loop limit exceeded")) {
    return false;
  }
  if (err.message.includes("Script error")) {
    return false;
  }
  // Let other errors fail the test
  return true;
});
