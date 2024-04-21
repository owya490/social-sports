import { Logger } from "@/observability/logger";
import { EVENTS_REFRESH_MILLIS, LocalStorageKeys } from "../eventsConstants";
const rateLimitLogger = new Logger("RateLimitLogger");

export function rateLimitCreateAndUpdateEvents(): boolean {
  const now = new Date();
  const maybeOperationCount5minString = localStorage.getItem(LocalStorageKeys.OperationCount5Min);
  const maybeLastCreateUpdateOperationTimestampString = localStorage.getItem(
    LocalStorageKeys.LastCreateUpdateOperationTimestamp
  );

  if (maybeOperationCount5minString !== null && maybeLastCreateUpdateOperationTimestampString !== null) {
    const operationCount5min = parseInt(maybeOperationCount5minString);
    const lastCreateUpdateOperationTimestamp = new Date(maybeLastCreateUpdateOperationTimestampString);

    if (now.valueOf() - lastCreateUpdateOperationTimestamp.valueOf() < EVENTS_REFRESH_MILLIS) {
      if (operationCount5min >= 5) {
        rateLimitLogger.warn("Rate limit exceeded for create and update operations.");
        return false;
      } else {
        localStorage.setItem(LocalStorageKeys.OperationCount5Min, (operationCount5min + 1).toString());
        return true;
      }
    }
    localStorage.setItem(LocalStorageKeys.OperationCount5Min, "0");
    localStorage.setItem(LocalStorageKeys.LastCreateUpdateOperationTimestamp, now.toUTCString());
    return true;
  }
  // allow edit as one is null
  localStorage.setItem(LocalStorageKeys.OperationCount5Min, "0");
  localStorage.setItem(LocalStorageKeys.LastCreateUpdateOperationTimestamp, now.toUTCString());
  return true;
}
