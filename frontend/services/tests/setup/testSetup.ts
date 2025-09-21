import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Global test setup and configuration

// Setup global variables for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Firebase globally
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    writeBatch: jest.fn(),
    runTransaction: jest.fn(),
  })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(),
  runTransaction: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
    }),
    now: () => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: (Date.now() % 1000) * 1000000,
    }),
  },
  arrayUnion: jest.fn((...items) => ({ type: "arrayUnion", items })),
  arrayRemove: jest.fn((...items) => ({ type: "arrayRemove", items })),
  increment: jest.fn((value) => ({ type: "increment", value })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
    },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve("https://example.com/mock-url.jpg")),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";

// Setup console methods for testing
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress console errors/warnings during tests unless they're test-related
  console.error = (...args) => {
    if (args[0]?.includes && args[0].includes("Warning:")) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (args[0]?.includes && args[0].includes("Warning:")) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
  // Utility to wait for async operations
  waitForAsync: (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Utility to create mock promises
  createMockPromise: (resolveValue?: any, rejectValue?: any) => {
    if (rejectValue) {
      return Promise.reject(rejectValue);
    }
    return Promise.resolve(resolveValue);
  },

  // Utility to create mock functions with specific behavior
  createMockFunction: (returnValue?: any, shouldThrow?: boolean) => {
    const mockFn = jest.fn();
    if (shouldThrow) {
      mockFn.mockImplementation(() => {
        throw new Error(returnValue || "Mock error");
      });
    } else {
      mockFn.mockReturnValue(returnValue);
    }
    return mockFn;
  },
};

// Setup for React Testing Library
import { configure } from "@testing-library/react";

configure({
  testIdAttribute: "data-testid",
});

// Performance monitoring setup for tests
if (process.env.NODE_ENV === "test" && process.env.MONITOR_PERFORMANCE) {
  const { performance } = require("perf_hooks");

  beforeEach(() => {
    global.testStartTime = performance.now();
  });

  afterEach(() => {
    const testEndTime = performance.now();
    const testDuration = testEndTime - global.testStartTime;

    if (testDuration > 5000) {
      // Tests taking longer than 5 seconds
      console.warn(`⚠️  Slow test detected: ${testDuration.toFixed(2)}ms`);
    }
  });
}

// Global error handler for unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Cleanup function for tests
global.testCleanup = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
};

// Custom matchers for better assertions
expect.extend({
  toBeValidEventData(received) {
    const requiredFields = [
      "name",
      "location",
      "capacity",
      "price",
      "organiserId",
      "startDate",
      "endDate",
      "registrationDeadline",
      "locationLatLng",
    ];

    const missingFields = requiredFields.filter((field) => !(field in received));

    if (missingFields.length > 0) {
      return {
        message: () => `Expected event data to have all required fields. Missing: ${missingFields.join(", ")}`,
        pass: false,
      };
    }

    return {
      message: () => "Expected event data to be invalid",
      pass: true,
    };
  },

  toBeValidTimestamp(received) {
    const hasToDate = received && typeof received.toDate === "function";
    const hasSeconds = received && typeof received.seconds === "number";

    return {
      message: () =>
        hasToDate && hasSeconds
          ? "Expected value not to be a valid Firestore Timestamp"
          : "Expected value to be a valid Firestore Timestamp with toDate() method and seconds property",
      pass: hasToDate && hasSeconds,
    };
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEventData(): R;
      toBeValidTimestamp(): R;
    }
  }

  var testUtils: {
    waitForAsync: (ms?: number) => Promise<void>;
    createMockPromise: (resolveValue?: any, rejectValue?: any) => Promise<any>;
    createMockFunction: (returnValue?: any, shouldThrow?: boolean) => jest.Mock;
  };

  var testStartTime: number;
  var testCleanup: () => void;
}
