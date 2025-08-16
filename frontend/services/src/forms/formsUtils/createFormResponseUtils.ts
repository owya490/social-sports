import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { v4 as uuidv4 } from "uuid";
import { FORM_RESPONSE_MAX_EVENTS, FORM_RESPONSE_REFRESH_MILLIS, LocalStorageKeys } from "../formsConstants";

const createFormResponseLogger = new Logger("createFormResponseLogger");

export function rateLimitCreateFormResponse(): boolean {
  const now = new Date();
  const maybeFormResponseOperationCount5Sec = localStorage.getItem(LocalStorageKeys.FormResponseOperationCount5Sec);
  const maybeFormResponseLastCreatedUpdateOperationTimestamp = localStorage.getItem(
    LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp
  );

  if (maybeFormResponseOperationCount5Sec !== null && maybeFormResponseLastCreatedUpdateOperationTimestamp !== null) {
    const formResponseOperationCount5Sec = parseInt(maybeFormResponseOperationCount5Sec);
    const formResponseLastCreatedUpdateOperationTimestamp = new Date(
      maybeFormResponseLastCreatedUpdateOperationTimestamp
    );

    if (now.valueOf() - formResponseLastCreatedUpdateOperationTimestamp.valueOf() < FORM_RESPONSE_REFRESH_MILLIS) {
      if (formResponseOperationCount5Sec >= FORM_RESPONSE_MAX_EVENTS) {
        createFormResponseLogger.warn("Rate limit exceeded for create and update operation.");
        return false;
      } else {
        localStorage.setItem(
          LocalStorageKeys.FormResponseOperationCount5Sec,
          (formResponseOperationCount5Sec + 1).toString()
        );
        return true;
      }
    }
    localStorage.setItem(LocalStorageKeys.FormResponseOperationCount5Sec, "1");
    localStorage.setItem(LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp, now.toUTCString());
    return true;
  }

  localStorage.setItem(LocalStorageKeys.FormResponseOperationCount5Sec, "1");
  localStorage.setItem(LocalStorageKeys.FormResponseLastCreateUpdateOperationTimestamp, now.toUTCString());
  return true;
}

export function extractFormResponseFromForm(formId: FormId, eventId: EventId, form: Form): FormResponse {
  return {
    formId: formId,
    eventId: eventId,
    responseMap: form.sectionsMap,
    formResponseId: uuidv4() as FormResponseId,
    responseSectionsOrder: form.sectionsOrder,
    submissionTime: null,
  };
}
