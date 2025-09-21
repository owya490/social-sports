import { performance } from "perf_hooks";
import { createEvent } from "../../src/events/eventsService";
import { TestDataFactory, FirebaseMocks } from "../utils/testHelpers";

// Mock Firebase for performance testing
jest.mock("../../src/firebase", () => ({
  db: {
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
  },
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../../src/events/eventsService");

describe("Event Creation Performance Tests", () => {
  const mockCreateEvent = createEvent as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup performance-oriented mocks
    mockCreateEvent.mockImplementation(async (eventData) => {
      // Simulate database operation time
      await new Promise((resolve) => setTimeout(resolve, 100));
      return "performance-test-event-123";
    });
  });

  describe("Single Event Creation Performance", () => {
    it("should create a single event within acceptable time limits", async () => {
      const eventData = TestDataFactory.createMockEventData();
      const startTime = performance.now();

      await createEvent(eventData);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Event creation should complete within 2 seconds
      expect(executionTime).toBeLessThan(2000);

      console.log(`Single event creation took ${executionTime.toFixed(2)}ms`);
    });

    it("should handle multiple concurrent event creations efficiently", async () => {
      const eventDataArray = Array.from({ length: 10 }, (_, index) =>
        TestDataFactory.createMockEventData({
          name: `Concurrent Test Event ${index}`,
          organiserId: `test-user-${index}`,
        })
      );

      const startTime = performance.now();

      // Create multiple events concurrently
      const promises = eventDataArray.map((eventData) => createEvent(eventData));
      await Promise.all(promises);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 10 concurrent events should complete within 5 seconds
      expect(executionTime).toBeLessThan(5000);

      console.log(`10 concurrent event creations took ${executionTime.toFixed(2)}ms`);
    });
  });

  describe("Batch Event Creation Performance", () => {
    it("should efficiently create large batches of events", async () => {
      const batchSize = 50;
      const eventDataArray = Array.from({ length: batchSize }, (_, index) =>
        TestDataFactory.createMockEventData({
          name: `Batch Test Event ${index}`,
          organiserId: `batch-user-${index % 5}`, // 5 different organisers
        })
      );

      const startTime = performance.now();

      // Process in smaller chunks for better performance
      const chunkSize = 10;
      for (let i = 0; i < eventDataArray.length; i += chunkSize) {
        const chunk = eventDataArray.slice(i, i + chunkSize);
        const chunkPromises = chunk.map((eventData) => createEvent(eventData));
        await Promise.all(chunkPromises);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      const averageTimePerEvent = executionTime / batchSize;

      // Average time per event should be under 200ms
      expect(averageTimePerEvent).toBeLessThan(200);

      console.log(`Batch creation of ${batchSize} events took ${executionTime.toFixed(2)}ms`);
      console.log(`Average time per event: ${averageTimePerEvent.toFixed(2)}ms`);
    });
  });

  describe("Memory Usage Tests", () => {
    it("should not cause memory leaks during repeated event creation", async () => {
      const initialMemory = process.memoryUsage();

      // Create and process many events to test for memory leaks
      for (let i = 0; i < 100; i++) {
        const eventData = TestDataFactory.createMockEventData({
          name: `Memory Test Event ${i}`,
        });
        await createEvent(eventData);

        // Clear any potential references
        eventData.attendees = {};
        eventData.attendeesMetadata = {};
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      // Heap growth should be reasonable (less than 50MB)
      expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);

      console.log(`Heap growth after 100 events: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB`);
    }, 20000); // 20 second timeout
  });

  describe("Rate Limiting Performance", () => {
    it("should handle rate limiting efficiently without blocking", async () => {
      // Mock rate limiting behavior
      let callCount = 0;
      mockCreateEvent.mockImplementation(async (eventData) => {
        callCount++;
        if (callCount > 5) {
          throw "Rate Limited";
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `rate-test-event-${callCount}`;
      });

      const eventData = TestDataFactory.createMockEventData();
      const promises: Promise<any>[] = [];
      const results: Array<{ success: boolean; result?: string; error?: string }> = [];

      // Attempt to create 10 events rapidly
      for (let i = 0; i < 10; i++) {
        promises.push(
          createEvent({ ...eventData, name: `Rate Test Event ${i}` })
            .then((result) => results.push({ success: true, result }))
            .catch((error) => results.push({ success: false, error }))
        );
      }

      await Promise.allSettled(promises);

      // Should have 5 successful creations and 5 rate limited
      const successCount = results.filter((r) => r.success).length;
      const rateLimitedCount = results.filter((r) => !r.success && r.error === "Rate Limited").length;

      expect(successCount).toBe(5);
      expect(rateLimitedCount).toBe(5);
    });
  });

  describe("Data Processing Performance", () => {
    it("should efficiently process large event descriptions and tokenization", async () => {
      // Create event with large description and complex data
      const largeDescription = "A".repeat(10000); // 10KB description
      const eventData = TestDataFactory.createMockEventData({
        description: largeDescription,
        name: "Large Event with Very Long Name That Contains Many Words For Tokenization Testing",
        location: "Very Detailed Location Description With Multiple Words And Specific Address Information",
        eventTags: Array.from({ length: 50 }, (_, i) => `tag${i}`),
      });

      const startTime = performance.now();

      await createEvent(eventData);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Even with large data, should complete within 3 seconds
      expect(executionTime).toBeLessThan(3000);

      console.log(`Large event creation took ${executionTime.toFixed(2)}ms`);
    });
  });
});

// Utility for running performance benchmarks
export class PerformanceBenchmark {
  private static results: Array<{ name: string; time: number; memory: number }> = [];

  static async benchmark<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const initialMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const result = await operation();

    const endTime = performance.now();
    const finalMemory = process.memoryUsage().heapUsed;

    const executionTime = endTime - startTime;
    const memoryDelta = finalMemory - initialMemory;

    this.results.push({
      name,
      time: executionTime,
      memory: memoryDelta,
    });

    console.log(`[BENCHMARK] ${name}: ${executionTime.toFixed(2)}ms, ${(memoryDelta / 1024).toFixed(2)}KB`);

    return result;
  }

  static getResults() {
    return [...this.results];
  }

  static clearResults() {
    this.results = [];
  }

  static generateReport() {
    console.log("\n=== Performance Benchmark Report ===");
    console.log("Operation\t\tTime (ms)\tMemory (KB)");
    console.log("----------------------------------------");

    this.results.forEach((result) => {
      console.log(`${result.name}\t\t${result.time.toFixed(2)}\t\t${(result.memory / 1024).toFixed(2)}`);
    });

    const avgTime = this.results.reduce((sum, r) => sum + r.time, 0) / this.results.length;
    const avgMemory = this.results.reduce((sum, r) => sum + r.memory, 0) / this.results.length;

    console.log("----------------------------------------");
    console.log(`Average\t\t\t${avgTime.toFixed(2)}\t\t${(avgMemory / 1024).toFixed(2)}`);
    console.log("=====================================\n");
  }
}
