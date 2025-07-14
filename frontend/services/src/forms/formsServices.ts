import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, doc, getDoc, getDocs, updateDoc, WriteBatch, writeBatch } from "firebase/firestore";
import { getEventById } from "../events/eventsService";
import { db } from "../firebase";
import { getPublicUserById } from "../users/usersService";
import { FormPaths, FormResponseStatus, FormsRootPath, FormStatus, FormTemplatePaths } from "./formsConstants";
import { rateLimitCreateFormResponse } from "./formsUtils/createFormResponseUtils";
import { appendFormIdForUser, rateLimitCreateForm } from "./formsUtils/createFormUtils";
import { findFormDoc, findFormResponseDoc, findFormResponseDocRef } from "./formsUtils/formsUtils";

export const formsServiceLogger = new Logger("formsServiceLogger");

/**
 * Creates a new active form in Firestore and associates it with the user.
 *
 * @param form - The form data to be created
 * @returns The unique ID of the newly created form
 * @throws If rate limiting is exceeded or the Firestore operation fails
 */
export async function createForm(form: Form): Promise<FormId> {
  if (!rateLimitCreateForm()) {
    formsServiceLogger.warn("Rate Limited!!!");
    throw "createForm: Rate Limited";
  }
  formsServiceLogger.info(`createForm: ${JSON.stringify(form)}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(collection(db, FormsRootPath, FormPaths.FormTemplates, FormStatus.Active));
    batch.set(docRef, form);
    await batch.commit();
    await appendFormIdForUser(docRef.id as FormId, form.userId);
    formsServiceLogger.info(`Form created successfully with formId: ${docRef.id}, form: ${form}`);

    return docRef.id as FormId;
  } catch (error) {
    formsServiceLogger.error(`createForm: ${error}`);
    throw error;
  }
}

/**
 * Retrieves a form by its ID from any collection.
 *
 * @param formId - The unique identifier of the form to retrieve
 * @returns The form data associated with the specified form ID
 */
export async function getForm(formId: FormId): Promise<Form> {
  try {
    const formDocSnapshot = await findFormDoc(formId);
    const formDoc = formDocSnapshot.data() as Form;

    formsServiceLogger.info(`getForm: Successfully retrieved information for formId: ${formId}`);
    return formDoc;
  } catch (error) {
    formsServiceLogger.error(`getForm: Error getting form for formId: ${formId}, error: ${error}`);
    throw error;
  }
}

/**
 * Retrieves the form ID associated with a given event ID.
 *
 * @param eventId - The ID of the event to look up
 * @param bypassCache - If true, bypasses any cache when fetching the event
 * @returns The form ID if associated with the event, or null if none exists
 */
export async function getFormIdByEventId(eventId: EventId, bypassCache: boolean = false): Promise<FormId | null> {
  formsServiceLogger.info(`getFormIdByEventId: ${eventId}`);
  try {
    const event = await getEventById(eventId, bypassCache);
    if (!event.formId) {
      formsServiceLogger.info(`getFormIdByEventId: No form associated with eventId: ${eventId}`);
      return null; // No form associated with this event
    }
    formsServiceLogger.info(
      `getFormIdByEventId: Successfully retrieved formId: ${event.formId} for eventId: ${eventId}`
    );
    return event.formId as FormId;
  } catch (error) {
    formsServiceLogger.error(`getFormIdByEventId: Error getting formId for eventId: ${eventId}, error: ${error}`);
    throw error;
  }
}

/**
 * Retrieves the form associated with a given event ID.
 *
 * @param eventId - The ID of the event to look up
 * @param bypassCache - If true, bypasses any caching when retrieving the form ID
 * @returns The form associated with the event, or undefined if no form is linked to the event
 */
export async function getFormByEventId(eventId: EventId, bypassCache: boolean = false): Promise<Form | undefined> {
  formsServiceLogger.info(`getFormByEventId: ${eventId}`);
  try {
    const formId = await getFormIdByEventId(eventId, bypassCache);
    if (!formId) {
      formsServiceLogger.info(`getFormByEventId: No form associated with eventId: ${eventId}`);
      return undefined; // No form associated with this event
    }
    return await getForm(formId);
  } catch (error) {
    formsServiceLogger.error(`getFormByEventId: Error getting form for eventId: ${eventId}, error: ${error}`);
    throw error;
  }
}

/**
 * Retrieves all active forms from the Firestore active forms collection.
 *
 * @returns An array of active form objects.
 */
export async function getActiveForms(): Promise<Form[]> {
  formsServiceLogger.info("getActiveForms");
  try {
    const activeFormsCollectionRef = collection(db, FormTemplatePaths.FormsActive);
    const activeFormsSnapshot = await getDocs(activeFormsCollectionRef);
    const activeForms: Form[] = [];

    activeFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      activeForms.push(formData);
    });

    return activeForms;
  } catch (error) {
    formsServiceLogger.error(`getActiveForms: Error getting active forms: ${error}`);
    throw error;
  }
}

/**
 * Retrieves all deleted forms from the Firestore deleted forms collection.
 *
 * @returns An array of deleted form objects.
 */
export async function getDeletedForms(): Promise<Form[]> {
  formsServiceLogger.info("getDeletedForms");
  try {
    const deletedFormsCollectionRef = collection(db, FormTemplatePaths.FormsDeleted);
    const deletedFormsSnapshot = await getDocs(deletedFormsCollectionRef);
    const deletedForms: Form[] = [];

    deletedFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      deletedForms.push(formData);
    });

    return deletedForms;
  } catch (error) {
    formsServiceLogger.error(`getActiveForms: Error getting active forms: ${error}`);
    throw error;
  }
}

/**
 * Updates an existing active form with the provided partial form data.
 *
 * Throws an error if the form does not exist.
 */
export async function updateActiveForm(formData: Partial<Form>, formId: FormId): Promise<void> {
  formsServiceLogger.info(`updateActiveForm: ${formId}`);
  try {
    // Updates are only allowed on active forms and not on deleted forms
    const formDocRef = doc(db, FormTemplatePaths.FormsActive, formId);

    const formDocSnapshot = await getDoc(formDocRef);
    if (!formDocSnapshot.exists()) {
      throw new Error(`Form with id: '${formId}' not found`);
    }

    await updateDoc(formDocRef, formData);

    formsServiceLogger.info(`Successfully updated form with id: '${formId}' and contents: ${formData}`);
  } catch (error) {
    formsServiceLogger.error(`updateActiveForm: Failed to update form with formId: ${formId}, form: ${formData}`);
    throw error;
  }
}

/**
 * Moves a form from the active forms collection to the deleted forms collection in Firestore.
 *
 * The form's data is copied to the deleted collection with `formActive` set to `false` and a `deletedAt` timestamp, and the original active form document is removed.
 *
 * @throws If the form with the specified ID does not exist.
 */
export async function deleteForm(formId: FormId): Promise<void> {
  formsServiceLogger.info(`deleteForm with formId: ${formId}`);
  const batch: WriteBatch = writeBatch(db);
  try {
    const docRef = doc(db, FormTemplatePaths.FormsActive, formId);
    const formSnapshot = await getDoc(docRef);

    if (!formSnapshot.exists()) {
      formsServiceLogger.error(`deleteForm: formId ${formId} not found`);
      throw new Error(`Form with ID ${formId} not found`);
    }

    const formData = formSnapshot.data() as Form;
    const deletedFormRef = doc(db, FormTemplatePaths.FormsDeleted, formId);

    batch.set(deletedFormRef, {
      ...formData,
      formActive: false,
      deletedAt: Date.now(),
    });

    batch.delete(docRef);

    await batch.commit();
    formsServiceLogger.info(`Successfully moved form to deleted with id: '${formId}' and contents: ${formData}`);
  } catch (error) {
    formsServiceLogger.error(`deleteForm: Error Failed to delete form with formId: ${formId}`);
    throw error;
  }
}

/**
 * Creates a new submitted form response document for a specific event and form in Firestore.
 *
 * @param formResponse - The form response data to be stored
 * @param eventId - The ID of the event associated with the form response
 * @returns The unique ID of the created form response document
 *
 * @throws If rate limiting is exceeded or if the Firestore operation fails
 */
export async function createFormResponse(formResponse: FormResponse, eventId: EventId): Promise<FormResponseId> {
  if (!rateLimitCreateFormResponse()) {
    formsServiceLogger.warn("Rate Limited!!!");
    throw "createFormResponse: Rate Limited";
  }

  formsServiceLogger.info(`createFormResponse: ${formResponse}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(
      collection(db, FormsRootPath, FormPaths.FormResponses, FormResponseStatus.Submitted, formResponse.formId, eventId)
    );
    batch.set(docRef, formResponse);
    await batch.commit();
    formsServiceLogger.info(
      `createFormResponse: Form response created with formResponseId: ${docRef.id}, formResponse: ${formResponse}`
    );
    return docRef.id as FormResponseId;
  } catch (error) {
    formsServiceLogger.error(
      `createFormResponse Error: Failed to create submitted form response with formResponse: ${formResponse}`
    );
    throw error;
  }
}

export async function getFormResponse(
  formId: FormId,
  eventId: EventId,
  responseId: FormResponseId
): Promise<FormResponse> {
  try {
    const responseSnapshot = await findFormResponseDoc(formId, eventId, responseId);

    if (!responseSnapshot.exists()) {
      formsServiceLogger.error(`getFormResponse: formResponseId ${formId} not found`);
      throw new Error(
        `getFormResponse: Could not find form response with formId: ${formId}, eventId: ${eventId} and responseId: ${responseId}`
      );
    }

    const responseDoc = responseSnapshot.data() as FormResponse;
    return responseDoc;
  } catch (error) {
    formsServiceLogger.error(
      `getFormResponse: Error getting form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}`
    );
    throw error;
  }
}

export async function updateFormResponse(
  formId: FormId,
  eventId: EventId,
  responseId: FormResponseId,
  formResponse: Partial<FormResponse>
): Promise<void> {
  try {
    const docRef = await findFormResponseDocRef(formId, eventId, responseId);

    const responseDocSnapshot = await getDoc(docRef);
    if (!responseDocSnapshot.exists()) {
      formsServiceLogger.error(`updateFormResponse: formResponseId ${formId} not found`);
      throw new Error(
        `updateFormResponse: Error updating form response because docRef does not exist, formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}`
      );
    }

    await updateDoc(docRef, formResponse);
  } catch (error) {
    formsServiceLogger.error(
      `updateFormResponse: Error editing form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}, updated form response: ${formResponse}, error: ${error}`
    );
    throw error;
  }
}

/**
 * Retrieves all forms, both active and deleted, associated with a specific user.
 *
 * @param userId - The ID of the user whose forms are to be retrieved
 * @returns An array of forms belonging to the specified user
 */
export async function getFormsForUser(userId: UserId): Promise<Form[]> {
  formsServiceLogger.info(`getFormsForUser: ${userId}`);
  try {
    const activeFormsCollectionRef = collection(db, FormTemplatePaths.FormsActive);
    const deletedFormsCollectionRef = collection(db, FormTemplatePaths.FormsDeleted);

    const [activeFormsSnapshot, deletedFormsSnapshot] = await Promise.all([
      getDocs(activeFormsCollectionRef),
      getDocs(deletedFormsCollectionRef),
    ]);

    const allForms: Form[] = [];

    activeFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      if (formData.userId === userId) {
        allForms.push(formData);
      }
    });

    deletedFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      if (formData.userId === userId) {
        allForms.push(formData);
      }
    });

    return allForms;
  } catch (error) {
    formsServiceLogger.error(`getFormsForUser: Error getting forms for userId: ${userId}, error: ${error}`);
    throw error;
  }
}

/**
 * Retrieves all active forms associated with a specific user.
 *
 * Fetches the user's public data to obtain their form IDs, retrieves each form, and returns only those that are currently active.
 *
 * @param userId - The unique identifier of the user whose active forms are to be retrieved
 * @returns An array of active forms belonging to the user
 */
export async function getActiveFormsForUser(userId: UserId): Promise<Form[]> {
  formsServiceLogger.info(`getActiveFormsForUser: ${userId}`);
  try {
    const activeForms: Form[] = [];
    const publicUserData = await getPublicUserById(userId);
    for (const formId of publicUserData.forms ?? []) {
      const form = await getForm(formId);
      if (form.formActive) {
        activeForms.push(form);
      }
    }

    formsServiceLogger.info(`getActiveFormsForUser: Successfully retrieved active forms for userId: ${userId}`);
    return activeForms;
  } catch (error) {
    formsServiceLogger.error(
      `getActiveFormsForUser: Error getting active forms for userId: ${userId}, error: ${error}`
    );
    throw error;
  }
}
