# Integration Testing Framework

This directory contains a comprehensive integration testing framework for the event creation workflow and other core features of the application.

## 🏗️ Test Architecture

### Test Types

1. **Integration Tests** (`*.integration.test.ts`)

   - Test service layer interactions
   - Mock external dependencies (Firebase, APIs)
   - Validate data flow between components

2. **Performance Tests** (`performance/*.performance.test.ts`)

   - Measure execution times and memory usage
   - Test concurrent operations
   - Validate rate limiting behavior

3. **End-to-End Tests** (`../cypress/e2e/*.cy.ts`)
   - Test complete user workflows
   - Interact with actual UI components
   - Validate API integrations

### Directory Structure

```
services/tests/
├── setup/
│   └── testSetup.ts           # Global test configuration
├── utils/
│   └── testHelpers.ts         # Shared utilities and mocks
├── performance/
│   └── *.performance.test.ts  # Performance benchmarks
└── *.integration.test.ts      # Integration tests
```

## 🚀 Running Tests

### Prerequisites

```bash
cd frontend
npm install
```

### Test Commands

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test                    # Unit tests only
npm run test:integration       # Integration tests
npm run test:performance       # Performance tests
npm run test:e2e              # End-to-end tests
npm run test:e2e:open         # Open Cypress UI

# Development
npm run test:watch            # Watch mode

# CI/CD
npm run test:ci               # CI-optimized run
```

## 📝 Writing Tests

### Integration Test Example

```typescript
import { TestDataFactory, APIResponseMocks } from "../utils/testHelpers";
import { createEvent } from "../src/events/eventsService";

describe("Event Creation Integration", () => {
  it("should create event successfully", async () => {
    // Arrange
    const eventData = TestDataFactory.createMockEventData();
    const mockCreateEvent = createEvent as jest.Mock;
    mockCreateEvent.mockResolvedValue("event-123");

    // Act
    const eventId = await createEvent(eventData);

    // Assert
    expect(eventId).toBe("event-123");
    expect(mockCreateEvent).toHaveBeenCalledWith(eventData);
  });
});
```

### Performance Test Example

```typescript
import { PerformanceBenchmark } from "../performance/eventCreation.performance.test";

describe("Performance Tests", () => {
  it("should complete within time limits", async () => {
    const result = await PerformanceBenchmark.benchmark("Event Creation", async () => {
      return await createEvent(testData);
    });

    expect(result).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
describe("Event Creation E2E", () => {
  it("should create event through UI", () => {
    cy.loginAsTestUser();
    cy.visit("/event/create");
    cy.fillCompleteEventForm();
    cy.get('[data-testid="create-event-button"]').click();
    cy.url().should("include", "/event/");
  });
});
```

## 🔧 Configuration

### Jest Configuration

Located in `package.json`:

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/services/tests/setup/testSetup.ts"],
    "moduleNameMapping": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

### Cypress Configuration

Located in `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

## 🧪 Test Utilities

### TestDataFactory

Creates consistent test data:

```typescript
// Create mock user
const user = TestDataFactory.createMockUser({
  firstName: "Custom Name",
});

// Create mock event
const event = TestDataFactory.createMockEventData({
  name: "Custom Event",
  capacity: 50,
});

// Create form data
const formData = TestDataFactory.createFormData();
```

### FirebaseMocks

Mock Firebase services:

```typescript
const mockFirestore = FirebaseMocks.mockFirestore();
const mockBatch = FirebaseMocks.mockWriteBatch();
const mockTransaction = FirebaseMocks.mockTransaction();
```

### APIResponseMocks

Mock API responses:

```typescript
// Success responses
APIResponseMocks.createEventSuccess("event-123");
APIResponseMocks.emailServiceSuccess();

// Error responses
APIResponseMocks.rateLimitError();
APIResponseMocks.firebaseError();
APIResponseMocks.networkError();
```

### Custom Matchers

Extended Jest matchers:

```typescript
// Validate event data structure
expect(eventData).toBeValidEventData();

// Validate Firestore timestamps
expect(timestamp).toBeValidTimestamp();
```

## 🎯 Testing Patterns

### 1. Arrange-Act-Assert Pattern

```typescript
it("should handle rate limiting", async () => {
  // Arrange
  const eventData = TestDataFactory.createMockEventData();
  (createEvent as jest.Mock).mockRejectedValue("Rate Limited");

  // Act & Assert
  await expect(createEvent(eventData)).rejects.toBe("Rate Limited");
});
```

### 2. Mock Management

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  global.testCleanup();
});
```

### 3. Error Testing

```typescript
it("should handle Firebase errors", async () => {
  const mockError = new Error("Firebase connection failed");
  (firebaseService as jest.Mock).mockRejectedValue(mockError);

  await expect(serviceFunction()).rejects.toThrow("Firebase connection failed");
});
```

## 🔍 Debugging Tests

### Debug Mode

```bash
# Run tests with debug output
npm run test -- --verbose

# Run specific test file
npm run test -- eventCreation.integration.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should create event"
```

### Cypress Debug

```bash
# Open Cypress in debug mode
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "cypress/e2e/eventCreation.cy.ts"
```

### Performance Monitoring

Enable performance monitoring:

```bash
MONITOR_PERFORMANCE=true npm run test
```

## 🚨 Common Issues

### 1. Mock Import Order

Ensure mocks are defined before imports:

```typescript
// ✅ Correct
jest.mock("../src/firebase");
import { createEvent } from "../src/events/eventsService";

// ❌ Incorrect
import { createEvent } from "../src/events/eventsService";
jest.mock("../src/firebase");
```

### 2. Async Test Timeout

Increase timeout for slow tests:

```typescript
it("should handle slow operation", async () => {
  // Test implementation
}, 15000); // 15 second timeout
```

### 3. Memory Leaks

Clean up references in tests:

```typescript
afterEach(() => {
  // Clear large objects
  eventData.attendees = {};
  eventData.attendeesMetadata = {};
});
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Library Documentation](https://testing-library.com/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

## 🤝 Contributing

1. Write tests for new features
2. Follow naming conventions (`*.integration.test.ts`, `*.performance.test.ts`)
3. Update documentation for new patterns
4. Run full test suite before submitting PRs

```bash
npm run test:all
```
