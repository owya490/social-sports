import { Logger } from "@/observability/logger";
import { FORM_RESPONSE_MAX_EVENTS, FORM_RESPONSE_REFRESH_MILLIS, LocalStorageKeys } from "../formsConstants";

const createFormResponseLogger = new Logger("createFormResponseLogger");

export function rateLimitCreateFormResponse(): boolean {
  const now = new Date();
  const maybeFormResponseOperationCount5Min = localStorage.getItem(LocalStorageKeys.FormResponseOperationCount5Min);
  const maybeFormResponseLastCreatedUpdateOperationTimestamp = localStorage.getItem(
    LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp
  );

  if (maybeFormResponseOperationCount5Min !== null && maybeFormResponseLastCreatedUpdateOperationTimestamp !== null) {
    const formResponseOperationCount5Min = parseInt(maybeFormResponseOperationCount5Min);
    const formResponseLastCreatedUpdateOperationTimestamp = new Date(
      maybeFormResponseLastCreatedUpdateOperationTimestamp
    );

    if (now.valueOf() - formResponseLastCreatedUpdateOperationTimestamp.valueOf() < FORM_RESPONSE_REFRESH_MILLIS) {
      if (formResponseOperationCount5Min >= FORM_RESPONSE_MAX_EVENTS) {
        createFormResponseLogger.warn("Rate limit exceeded for create and update operation.");
        return false;
      } else {
        localStorage.setItem(
          LocalStorageKeys.FormResponseOperationCount5Min,
          (formResponseOperationCount5Min + 1).toString()
        );
        return true;
      }
    }
    localStorage.setItem(LocalStorageKeys.FormResponseOperationCount5Min, "1");
    localStorage.setItem(LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp, now.toUTCString());
    return true;
  }

  localStorage.setItem(LocalStorageKeys.FormResponseOperationCount5Min, "1");
  localStorage.setItem(LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp, now.toUTCString());
  return true;
}
