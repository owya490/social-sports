import { FormId } from "@/interfaces/FormTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getPrivateUserById, updateUser } from "../../users/usersService";
import { FORMS_MAX_EVENTS, FORMS_REFRESH_MILLIS, LocalStorageKeys } from "../formsConstants";

const createFormUtilsLogger = new Logger("createFormUtilsLogger");

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
 * Helper function to append a formId for a specified user.
 */
export async function appendFormIdForUser(formId: FormId, userId: UserId): Promise<void> {
  createFormUtilsLogger.info(`Appending formId ${formId} to userId: ${userId}`);
  try {
    const privateUserData = await getPrivateUserById(userId);
    privateUserData.forms !== undefined && privateUserData.forms !== null
      ? privateUserData.forms.push(formId)
      : (privateUserData.forms = [formId]);
    await updateUser(userId, privateUserData);
    createFormUtilsLogger.info(`Successfully appended formId ${formId} to userId: ${userId}`);
  } catch (error) {
    createFormUtilsLogger.error(`appendFormIdForUser Error: ${error}`);
  }
}
