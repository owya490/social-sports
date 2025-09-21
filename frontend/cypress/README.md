# 🎯 End-to-End (E2E) Testing Guide

## 📋 Overview

This E2E testing suite uses **Cypress** to test the complete event creation workflow in your social sports application. The tests verify the entire user journey from form filling to event creation confirmation.

## 🚀 Quick Start Commands

### **Essential Commands**

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open Cypress Test Runner (interactive)
npm run test:e2e:open

# Run E2E tests with Chrome browser
npx cypress run --browser chrome

# Run specific test file
npx cypress run --spec "cypress/e2e/eventCreation.cy.ts"
```

### **Development Commands**

```bash
# Start the dev server (required for E2E tests)
npm run dev

# Run E2E tests in headed mode (see browser)
npx cypress run --headed

# Run with specific browser
npx cypress run --browser firefox
npx cypress run --browser edge
```

## 📁 Test Structure

```
frontend/cypress/
├── e2e/
│   └── eventCreation.cy.ts          # Main E2E test suite
├── support/
│   ├── e2e.ts                       # Global configuration
│   └── commands.ts                  # Custom Cypress commands
├── screenshots/                     # Test failure screenshots
├── cypress.config.ts                # Cypress configuration
└── README.md                        # This file
```

## 🧪 Test Suite Breakdown

### **6 Comprehensive Tests**

| Test Name                                                                  | Purpose                 | Duration | What It Tests                                            |
| -------------------------------------------------------------------------- | ----------------------- | -------- | -------------------------------------------------------- |
| `should create a volleyball event through the entire workflow`             | Complete user journey   | ~15s     | Full form filling, multi-step navigation, event creation |
| `should handle form validation`                                            | Form validation logic   | ~4s      | Required fields, validation messages                     |
| `should verify event creation through API and database check`              | Database verification   | ~14s     | Event persistence, database storage                      |
| `should verify event creation through UI changes and redirects`            | URL-based verification  | ~10s     | Page redirects, navigation flow                          |
| `should create an event and verify through comprehensive API interception` | Firebase API monitoring | ~16s     | Firebase Function calls, network requests                |
| `should intercept and analyze all Firebase network activity`               | Network analysis        | ~15s     | Complete network traffic monitoring                      |

## 🔧 Configuration

### **Cypress Configuration** (`cypress.config.ts`)

```typescript
{
  baseUrl: "http://localhost:3000",
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000
}
```

### **Test Environment Setup**

```typescript
// Tests automatically set up mock user data
beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      "mockUser",
      JSON.stringify({
        userId: "test-user-cypress",
        email: "cypress-test@example.com",
        firstName: "Cypress",
        lastName: "Tester",
      })
    );
  });
});
```

## 🎯 What Each Test Validates

### **1. Complete Workflow Test**

- ✅ Multi-step form navigation
- ✅ Event name, location, sport selection
- ✅ Image upload handling
- ✅ Description entry
- ✅ Form submission
- ✅ URL redirect to created event
- ✅ Event page content verification

### **2. Form Validation Test**

- ✅ Required field validation
- ✅ Submit button behavior
- ✅ Error message display
- ✅ Form state management

### **3. Database Verification Test**

- ✅ Event persistence in database
- ✅ Event ID generation
- ✅ Event page accessibility
- ✅ Data integrity

### **4. UI Changes Test**

- ✅ URL changes after submission
- ✅ Page redirect behavior
- ✅ Success message detection
- ✅ Form state changes

### **5. API Interception Test**

- ✅ Firebase Function calls (`create_event`)
- ✅ Firestore write operations
- ✅ Request/response logging
- ✅ API data validation

### **6. Network Activity Test**

- ✅ Complete network traffic monitoring
- ✅ Firebase endpoint discovery
- ✅ Google APIs usage tracking
- ✅ Network performance analysis

## 🔍 Firebase Architecture Testing

### **What APIs Are Intercepted**

```typescript
// Firebase Functions
"**/australia-southeast1/**"; // Regional Firebase Functions
"**/cloudfunctions.googleapis.com/**"; // Cloud Functions API

// Firestore Operations
"**/firestore.googleapis.com/**"; // Firestore REST API
"**/databases/*/documents/**"; // Document operations
"**/databases/*:commit"; // Batch commits

// Firebase Services
"**/*firebase*/**"; // All Firebase domains
"**/*googleapis.com/**"; // Google APIs
```

### **Expected Network Activity**

```
✅ Firebase Authentication
✅ Firestore document writes
✅ Firebase Storage (images/thumbnails)
✅ Firebase Functions (create_event)
✅ Real-time listeners
✅ Regional endpoint calls (australia-southeast1)
```

## 🐛 Debugging & Troubleshooting

### **Common Issues**

#### **Test Timeouts**

```bash
# Increase timeout if tests are slow
npx cypress run --config defaultCommandTimeout=20000
```

#### **Authentication Issues**

```bash
# Check if dev server is running
npm run dev

# Verify localhost:3000 is accessible
curl http://localhost:3000
```

#### **Form Element Not Found**

```typescript
// Tests use multiple selector strategies:
// 1. input[type="text"]:visible
// 2. Button selectors: button[type="submit"]
// 3. Text content: cy.contains(/Create|Submit|Publish/i)
```

### **Debug Mode Commands**

```bash
# Run with debug output
DEBUG=cypress:* npx cypress run

# Run single test in headed mode
npx cypress run --spec "cypress/e2e/eventCreation.cy.ts" --headed

# Generate detailed logs
npx cypress run --reporter spec --reporter-options verbose=true
```

### **Screenshots & Videos**

```bash
# Screenshots saved on failure to:
# cypress/screenshots/eventCreation.cy.ts/

# Enable video recording:
# Set video: true in cypress.config.ts
```

## 📊 Test Results Interpretation

### **Success Indicators**

```
✅ All 6 tests passing
✅ No screenshots generated (no failures)
✅ Total duration: ~1 minute 15 seconds
✅ All specs passed!
```

### **Failure Indicators**

```
❌ X failing tests
📸 Screenshots generated
🔍 Specific error messages and stack traces
📍 Exact line numbers of failures
```

### **Performance Benchmarks**

```
🎯 Target Duration: ~75 seconds total
⚡ Fast Tests: Form validation (~4s)
🐌 Slow Tests: Complete workflow (~15s)
```

## 🔧 Custom Commands

### **Available Custom Commands**

```typescript
// Login as test user
cy.loginAsTestUser();

// Clean up test data
cy.cleanupTestEvents();
```

### **Usage Examples**

```typescript
// Use in your own tests
describe("My Custom Test", () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.visit("/event/create");
  });

  afterEach(() => {
    cy.cleanupTestEvents();
  });
});
```

## 🚀 CI/CD Integration

### **GitHub Actions**

```yaml
# Add to your workflow
- name: Run E2E Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e
```

### **Local Development Workflow**

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, run E2E tests
npm run test:e2e:open  # Interactive mode
# OR
npm run test:e2e       # Headless mode
```

## 📈 Test Coverage

### **Event Creation Workflow Coverage**

- ✅ **Frontend**: React components, form handling, validation
- ✅ **Backend**: Firebase Functions, Firestore operations
- ✅ **Integration**: API calls, database writes, authentication
- ✅ **User Experience**: Navigation, redirects, success feedback
- ✅ **Error Handling**: Validation, network failures, timeouts

### **Firebase Services Tested**

- ✅ **Authentication**: User login/session management
- ✅ **Firestore**: Document creation, batch operations
- ✅ **Functions**: `create_event` endpoint
- ✅ **Storage**: Image/thumbnail handling
- ✅ **Real-time**: Live data synchronization

## 🎓 Best Practices

### **Writing New E2E Tests**

```typescript
describe("My Feature", () => {
  beforeEach(() => {
    // Set up test data
    cy.visit("/my-page");
    cy.wait(2000); // Allow page to load
  });

  it("should perform user action", () => {
    // Use data-testid when possible
    cy.get('[data-testid="my-button"]').click();

    // Fallback to robust selectors
    cy.get('button[type="submit"]').click();

    // Verify results
    cy.url().should("include", "/success");
    cy.get("body").should("contain.text", "Expected content");
  });
});
```

### **Selector Best Practices**

```typescript
// ✅ Good selectors (in order of preference)
cy.get('[data-testid="event-name"]'); // Most reliable
cy.get("#event-name"); // ID selectors
cy.get('input[type="text"]:visible'); // Attribute + visibility
cy.contains("Create Event"); // Text content

// ❌ Avoid
cy.get(".css-class-xyz"); // CSS classes change
cy.get("div > span > input"); // Fragile structure
```

## 🔗 Related Documentation

- [Cypress Official Documentation](https://docs.cypress.io)
- [Firebase Testing Guide](https://firebase.google.com/docs/rules/unit-tests)
- [Frontend Integration Tests](../services/tests/README.md)
- [Backend Integration Tests](../../functions/lib/functions/src/test/README.md)

## 🆘 Support

### **Getting Help**

1. **Check test logs**: Look for specific error messages
2. **Run in headed mode**: See what's happening in the browser
3. **Use debug commands**: Get detailed Cypress logs
4. **Check dev server**: Ensure localhost:3000 is running
5. **Verify Firebase**: Check Firebase project connection

### **Common Solutions**

```bash
# Clear Cypress cache
npx cypress cache clear

# Reinstall Cypress
npm uninstall cypress
npm install cypress --save-dev

# Update Cypress
npm update cypress
```

---

## 🎉 Ready to Test!

Your E2E testing suite is fully configured and ready to ensure your event creation workflow works perfectly for real users!

```bash
# Start testing now:
npm run dev           # Terminal 1
npm run test:e2e:open # Terminal 2
```

**Happy Testing! 🚀**
