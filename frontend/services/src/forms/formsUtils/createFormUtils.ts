import { FormId } from "@/interfaces/FormTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getPublicUserById, updateUser } from "../../users/usersService";
import { FORMS_MAX_EVENTS, FORMS_REFRESH_MILLIS, LocalStorageKeys } from "../formsConstants";

const createFormUtilsLogger = new Logger("createFormUtilsLogger");

/**
 * Enforces a rate limit on form creation and update operations based on recent activity.
 *
 * Checks local storage for the number of form operations performed within a configured time window and restricts further actions if the maximum allowed threshold is exceeded. Returns `true` if the operation is permitted, or `false` if rate limited.
 *
 * @returns Whether the form creation or update operation is allowed under the current rate limit
 */
export function rateLimitCreateForm(): boolean {
  const now = new Date();
  const maybeFormsOperationCount5Min = localStorage.getItem(LocalStorageKeys.FormsOperationCount5Min);
  const maybeFormsLastCreateUpdateOperationTimestamp = localStorage.getItem(
    LocalStorageKeys.FormsLastCreateUpdateOperationTimestamp
  );

  if (maybeFormsOperationCount5Min !== null && maybeFormsLastCreateUpdateOperationTimestamp !== null) {
    const formsOperationCount5Min = parseInt(maybeFormsOperationCount5Min);
    const formsLastCreateUpdateOperationTimestamp = new Date(maybeFormsLastCreateUpdateOperationTimestamp);

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

/**
 * Appends a form ID to the specified user's list of forms, creating the list if it does not exist.
 *
 * Retrieves the user's public data, updates the `forms` array to include the new form ID, and persists the change.
 */
export async function appendFormIdForUser(formId: FormId, userId: UserId): Promise<void> {
  try {
    const publicUserData = await getPublicUserById(userId);
    publicUserData.forms !== undefined && publicUserData.forms !== null
      ? publicUserData.forms.push(formId)
      : (publicUserData.forms = [formId]);
    await updateUser(userId, publicUserData);
    createFormUtilsLogger.info(`Successfully appended formId ${formId} to userId: ${userId}`);
  } catch (error) {
    createFormUtilsLogger.error(`appendFormIdForUser Error: ${error}`);
  }
}
