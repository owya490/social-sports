import { Logger } from "@/observability/logger";
import { FORMS_MAX_EVENTS, FORMS_REFRESH_MILLIS, LocalStorageKeys } from "../formsConstants";

const createFormUtilsLogger = new Logger("createFormUtilsLogger");

export function rateLimitCreateForm(): boolean {
  const now = new Date();
  const maybeFormsOperationCount5Min = localStorage.getItem(LocalStorageKeys.FormsOperationCount5Min);
  const maybeFormsLastCreatedUpdateOperationTimestamp = localStorage.getItem(
    LocalStorageKeys.FormsLastCreateUpdateOperationTimestamp
  );

  if (maybeFormsOperationCount5Min !== null && maybeFormsLastCreatedUpdateOperationTimestamp !== null) {
    const formsOperationCount5Min = parseInt(maybeFormsOperationCount5Min);
    const formsLastCreateUpdateOperationTimestamp = new Date(maybeFormsLastCreatedUpdateOperationTimestamp);

    if (now.valueOf() - formsLastCreateUpdateOperationTimestamp.valueOf() < FORMS_REFRESH_MILLIS) {
      if (formsOperationCount5Min >= FORMS_MAX_EVENTS) {
        createFormUtilsLogger.warn("Rate limit exceeded for create and update operations.");
        return false;
      } else {
        localStorage.setItem(LocalStorageKeys.FormsOperationCount5Min, (formsOperationCount5Min + 1).toString());
        return true;
      }
    }
    localStorage.setItem(LocalStorageKeys.FormsOperationCount5Min, "1");
    localStorage.setItem(LocalStorageKeys.FormsLastCreateUpdateOperationTimestamp, now.toUTCString());
    return true;
  }

  localStorage.setItem(LocalStorageKeys.FormsOperationCount5Min, "1");
  localStorage.setItem(LocalStorageKeys.FormsLastCreateUpdateOperationTimestamp, now.toUTCString());
  return true;
}
