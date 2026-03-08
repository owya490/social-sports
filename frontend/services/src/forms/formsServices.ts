import { EventId } from "@/interfaces/EventTypes";
import {
  EmptyForm,
  EmptyFormResponse,
  Form,
  FormId,
  FormResponse,
  FormResponseId,
  SaveTempFormResponseRequest,
  SaveTempFormResponseResponse,
} from "@/interfaces/FormTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  UpdateFulfilmentEntityWithFormResponseIdRequest,
} from "@/interfaces/FulfilmentTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { PrivateUserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, doc, getDoc, getDocs, Timestamp, updateDoc, WriteBatch, writeBatch } from "firebase/firestore";
import { getEventById } from "../events/eventsService";
import { db } from "../firebase";
import { fulfilmentServiceLogger } from "../fulfilment/fulfilmentServices";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { getPrivateUserById } from "../users/usersService";
import { FormPaths, FormResponsePaths, FormsRootPath, FormStatus, FormTemplatePaths } from "./formsConstants";
import { appendFormIdForUser, rateLimitCreateForm } from "./formsUtils/createFormUtils";
import { findFormDoc, findFormResponseDoc, findFormResponseDocRef } from "./formsUtils/formsUtils";

export const formsServiceLogger = new Logger("formsServiceLogger");

export async function createForm(form: Form): Promise<FormId> {
  if (!rateLimitCreateForm()) {
    formsServiceLogger.warn("Rate Limited!!!");
    throw "createForm: Rate Limited";
  }
  formsServiceLogger.info(`createForm: ${JSON.stringify(form)}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(collection(db, FormsRootPath, FormPaths.FormTemplates, FormStatus.Active));
    batch.set(docRef, { ...form, formId: docRef.id as FormId, lastUpdated: Timestamp.now() });
    await batch.commit();
    await appendFormIdForUser(docRef.id as FormId, form.userId);
    formsServiceLogger.info(`Form created successfully with formId: ${docRef.id}, form: ${form}`);

    return docRef.id as FormId;
  } catch (error) {
    formsServiceLogger.error(`createForm: ${error}`);
    throw error;
  }
}

/** Searches through all collections for form with formId */
export async function getForm(formId: FormId): Promise<Form> {
  try {
    const formDocSnapshot = await findFormDoc(formId);
    const formDoc = formDocSnapshot.data() as Form;

    formsServiceLogger.info(`getForm: Successfully retrieved information for formId: ${formId}`);
    return { ...EmptyForm, ...formDoc, formId: formId };
  } catch (error) {
    formsServiceLogger.error(`getForm: Error getting form for formId: ${formId}, error: ${error}`);
    throw error;
  }
}

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

export async function getActiveForms(): Promise<Form[]> {
  formsServiceLogger.info("getActiveForms");
  try {
    const activeFormsCollectionRef = collection(db, FormTemplatePaths.FormsActive);
    const activeFormsSnapshot = await getDocs(activeFormsCollectionRef);
    const activeForms: Form[] = [];

    activeFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      activeForms.push({ ...EmptyForm, ...formData, formId: docSnapshot.id as FormId });
    });

    return activeForms;
  } catch (error) {
    formsServiceLogger.error(`getActiveForms: Error getting active forms: ${error}`);
    throw error;
  }
}

export async function getDeletedForms(): Promise<Form[]> {
  formsServiceLogger.info("getDeletedForms");
  try {
    const deletedFormsCollectionRef = collection(db, FormTemplatePaths.FormsDeleted);
    const deletedFormsSnapshot = await getDocs(deletedFormsCollectionRef);
    const deletedForms: Form[] = [];

    deletedFormsSnapshot.forEach((docSnapshot) => {
      const formData = docSnapshot.data() as Form;
      deletedForms.push({ ...EmptyForm, ...formData, formId: docSnapshot.id as FormId });
    });

    return deletedForms;
  } catch (error) {
    formsServiceLogger.error(`getActiveForms: Error getting active forms: ${error}`);
    throw error;
  }
}

export async function updateActiveForm(formData: Partial<Form>, formId: FormId): Promise<void> {
  formsServiceLogger.info(`updateActiveForm: ${formId}`);
  try {
    // Updates are only allowed on active forms and not on deleted forms
    const formDocRef = doc(db, FormTemplatePaths.FormsActive, formId);

    const formDocSnapshot = await getDoc(formDocRef);
    if (!formDocSnapshot.exists()) {
      throw new Error(`Form with id: '${formId}' not found`);
    }

    await updateDoc(formDocRef, { ...formData, lastUpdated: Timestamp.now() });

    formsServiceLogger.info(`Successfully updated form with id: '${formId}' and contents: ${formData}`);
  } catch (error) {
    formsServiceLogger.error(`updateActiveForm: Failed to update form with formId: ${formId}, form: ${formData}`);
    throw error;
  }
}

/** Move form from active to deleted */
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
 * Form response MUST have all required section answers completed.
 */
export async function saveTempFormResponse(formResponse: FormResponse): Promise<FormResponseId> {
  const { formId, eventId } = formResponse;
  formsServiceLogger.info(`saveTempFormResponse: formId=${formId}, eventId=${eventId}`);

  try {
    const response = await executeGlobalAppControllerFunction<
      SaveTempFormResponseRequest,
      SaveTempFormResponseResponse
    >(EndpointType.SAVE_TEMP_FORM_RESPONSE, {
      formResponse,
    });

    formsServiceLogger.info(
      `saveTempFormResponse: Successfully saved form response with formResponseId: ${response.formResponseId}`
    );
    formsServiceLogger.debug(`saveTempFormResponse: Response data: ${JSON.stringify(response)}`);
    return response.formResponseId;
  } catch (error) {
    formsServiceLogger.error(
      `saveTempFormResponse: Failed to create submitted form response with formResponse: ${formResponse}`
    );
    throw error;
  }
}

/**
 * Form response MUST have all required section answers completed.
 */
export async function updateTempFormResponse(
  formResponse: FormResponse,
  formResponseId: FormResponseId
): Promise<FormResponseId> {
  formsServiceLogger.info(`updateTempFormResponse: ${JSON.stringify(formResponse)}`);

  formResponse.formResponseId = formResponseId; // Ensure the formResponseId is set

  try {
    return await saveTempFormResponse(formResponse);
  } catch (error) {
    formsServiceLogger.error(
      `updateTempFormResponse: Failed to update existing temp form response Id: ${formResponseId} with formResponse: ${formResponse}`
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
    responseDoc.formId = formId;
    responseDoc.eventId = eventId;
    return { ...EmptyFormResponse, ...responseDoc };
  } catch (error) {
    formsServiceLogger.error(
      `getFormResponse: Error getting form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}`
    );
    throw error;
  }
}

export async function getFormResponsesForEvent(formId: FormId, eventId: EventId): Promise<FormResponse[]> {
  formsServiceLogger.info(`getFormResponsesForEvent: ${formId}, ${eventId}`);
  try {
    const responseCollectionRef = collection(db, "Forms", "FormResponses", "Submitted", formId, eventId);
    const responsesSnapshot = await getDocs(responseCollectionRef);
    const responses: FormResponse[] = responsesSnapshot.docs.map((doc) => {
      const data = doc.data() as FormResponse;
      return { ...data, formResponseId: doc.id as FormResponseId };
    });

    return responses;
  } catch (error) {
    formsServiceLogger.error(
      `getFormResponsesForEvent: Error getting form responses for formId: ${formId}, eventId: ${eventId}`
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

    await updateDoc(docRef, { ...formResponse, formResponseId: responseId, submissionTime: Timestamp.now() });
  } catch (error) {
    formsServiceLogger.error(
      `updateFormResponse: Error editing form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}, updated form response: ${formResponse}, error: ${error}`
    );
    throw error;
  }
}

// Function to get all forms for a specific user
export async function getFormsForUser(userId: UserId): Promise<Form[]> {
  formsServiceLogger.info(`getFormsForUser: ${userId}`);
  try {
    const organiser: PrivateUserData = await getPrivateUserById(userId);
    console.log("organiser", organiser);

    const allForms: Form[] = [];
    // get all forms from the organiser
    for (const formId of organiser.forms) {
      const form = await getForm(formId);
      allForms.push({ ...EmptyForm, ...form });
    }

    return allForms;
  } catch (error) {
    formsServiceLogger.error(`getFormsForUser: Error getting forms for userId: ${userId}, error: ${error}`);
    throw error;
  }
}

// Function to get active forms for a specific user
export async function getActiveFormsForUser(userId: UserId): Promise<Form[]> {
  formsServiceLogger.info(`getActiveFormsForUser: ${userId}`);
  try {
    const activeForms: Form[] = [];
    const privateUserData = await getPrivateUserById(userId);
    for (const formId of privateUserData.forms ?? []) {
      const form = await getForm(formId);
      if (form.formActive) {
        activeForms.push({ ...EmptyForm, ...form });
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

export async function submitManualFormResponse(
  formId: FormId,
  eventId: EventId,
  formResponseId: FormResponseId
): Promise<void> {
  formsServiceLogger.info(
    `submitManualFormResponse: formId=${formId}, eventId=${eventId}, responseId=${formResponseId}`
  );

  try {
    const batch = writeBatch(db);

    // 1. Reference to Temp doc
    const tempDocRef = doc(db, FormResponsePaths.Temp, formId, eventId, formResponseId);

    // 2. Get the data
    const tempDocSnap = await getDoc(tempDocRef);
    if (!tempDocSnap.exists()) {
      throw new Error("Temp form response not found");
    }
    const data = tempDocSnap.data() as FormResponse;

    // 3. Add submission time
    data.submissionTime = Timestamp.now();

    // 4. Reference to Submitted doc
    const submittedDocRef = doc(db, FormResponsePaths.Submitted, formId, eventId, formResponseId);

    // 5. Add to batch
    batch.set(submittedDocRef, data);
    batch.delete(tempDocRef);

    // 6. Commit
    await batch.commit();
  } catch (error) {
    formsServiceLogger.error(
      `submitManualFormResponse: Failed to submit manual form response. formId: ${formId}, eventId: ${eventId}, formResponseId: ${formResponseId}, error: ${error}`
    );
    throw error;
  }
}

export async function updateFulfilmentEntityWithFormResponseId(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentEntityId: FulfilmentEntityId,
  formResponseId: FormResponseId
): Promise<void> {
  fulfilmentServiceLogger.info(
    `updateFulfilmentEntityWithFormResponseId: Updating fulfilment entity with form response ID for session ID: ${fulfilmentSessionId}, entity ID: ${fulfilmentEntityId}, form response ID: ${formResponseId}`
  );

  const request: UpdateFulfilmentEntityWithFormResponseIdRequest = {
    fulfilmentSessionId,
    fulfilmentEntityId,
    formResponseId,
  };

  try {
    const response = await executeGlobalAppControllerFunction<UpdateFulfilmentEntityWithFormResponseIdRequest, void>(
      EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID,
      request
    );

    fulfilmentServiceLogger.info(
      `updateFulfilmentEntityWithFormResponseId: Successfully updated fulfilment entity ${fulfilmentEntityId} in fulfilmentSession ${fulfilmentSessionId} with formResponseId: ${formResponseId}`
    );
    return response;
  } catch (error) {
    fulfilmentServiceLogger.error(
      `updateFulfilmentEntityWithFormResponseId: Failed to update fulfilment entity ${fulfilmentEntityId} in fulfilmentSession ${fulfilmentSessionId} with form response ID ${formResponseId}: ${error}`
    );
    throw error;
  }
}
