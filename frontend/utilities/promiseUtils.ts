import { Logger } from "@/observability/logger";

/**
 * Executes multiple promises concurrently and returns all successful results,
 * logging any failures without throwing errors.
 *
 * @param promises - Array of promises to execute
 * @param identifiers - Array of identifiers (IDs, names, etc.) corresponding to each promise for logging
 * @param logger - Logger instance to use for logging errors
 * @returns Object containing successful results and failed identifiers
 */
export async function executeResilientPromises<T, ID = string>(
  promises: Promise<T>[],
  identifiers: ID[],
  logger: Logger
): Promise<{
  successful: T[];
  failed: ID[];
}> {
  if (promises.length !== identifiers.length) {
    throw new Error("Promises and identifiers arrays must have the same length");
  }

  const results = await Promise.allSettled(promises);
  const successful: T[] = [];
  const failed: ID[] = [];

  results.forEach((result, index) => {
    const identifier = identifiers[index];

    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      failed.push(identifier);
      logger.error(`Failed to fetch ${identifier}: ${result.reason}`);
    }
  });

  if (failed.length > 0) {
    logger.warn(`Failed to fetch ${failed.length} out of ${identifiers.length}: ${failed.join(", ")}`);
  }

  return { successful, failed };
}
