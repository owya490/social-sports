import {
  Form,
  FormId,
  FormResponse,
  FormSection,
  FormResponseId,
  SectionId,
  FormSectionType,
} from "@/interfaces/FormTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { CollectionPaths, FormPaths, FormResponsePaths, FormStatus } from "./formsConstants";
import { rateLimitCreateForm } from "./formsUtils/createFormUtils";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";
import { EventId } from "@/interfaces/EventTypes";

export const formsServiceLogger = new Logger("formsServiceLogger");

export async function createForm(form: Form): Promise<FormId> {
  if (!rateLimitCreateForm()) {
    formsServiceLogger.warn("Rate Limited!!!");
  }
  formsServiceLogger.info(`createForm: ${form}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(db, CollectionPaths.Forms, FormStatus.Active);
    batch.set(docRef, form);
    batch.commit();
    formsServiceLogger.info(`Form created successfully with formId: ${docRef.id}, form: ${form}`);

    return docRef.id;
  } catch (error) {
    formsServiceLogger.error(`createForm: ${error}`);
    throw error;
  }
}

/** Searches through all collections for form with formId */
export async function getForm(formId: FormId): Promise<Form> {
  try {
    const formDocRef = await findEventDoc(formId);
    const formDoc = formDocRef.data() as Form;

    return formDoc;
  } catch (error) {
    formsServiceLogger.error(`Error getting form for formId: ${formId}, error: ${error}`);
    throw error;
  }
}

export async function getActiveForms(): Promise<Form[]> {
  formsServiceLogger.info("getActiveForms");
  try {
    const activeFormsCollectionRef = collection(db, FormPaths.FormsActive);
    const activeFormsSnapshot = await getDocs(activeFormsCollectionRef);
    const activeForms: Form[] = [];

    activeFormsSnapshot.forEach((doc) => {
      const formData = doc.data() as Form;
      activeForms.push(formData);
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
    const deletedFormsCollectionRef = collection(db, FormPaths.FormsDeleted);
    const deletedFormsSnapshot = await getDocs(deletedFormsCollectionRef);
    const deletedForms: Form[] = [];

    deletedFormsSnapshot.forEach((doc) => {
      const formData = doc.data() as Form;
      deletedForms.push(formData);
    });

    return deletedForms;
  } catch (error) {
    formsServiceLogger.error(`getActiveForms: Error getting active forms: ${error}`);
    throw error;
  }
}

/** Updates are only allowed on active forms and not on deleted forms */
export async function updateActiveForm(formData: Partial<Form>, formId: FormId): Promise<void> {
  formsServiceLogger.info(`updateActiveForm: ${formId}`);
  try {
    const formDocRef = doc(db, FormPaths.FormsActive, formId);

    const formDocSnapshot = await getDoc(formDocRef);
    if (!formDocSnapshot.exists()) {
      throw new Error(`Form with id: '${formId}' not found`);
    }

    await updateDoc(formDocRef, formData);

    formsServiceLogger.info(`Form with id: '${formId}' not updated successfully`);
  } catch (error) {
    formsServiceLogger.error(`updateActiveForm Error: failed to update form with formId: ${formId}, form: ${formData}`);
    throw error;
  }
}

export async function deleteForm(formId: FormId): Promise<void> {
  // TODO:
}

export async function createFormResponse(formResponse: FormResponse): Promise<FormResponseId> {
  // TODO: implement rate limiting

  formsServiceLogger.info(`createFormResponse: ${formResponse}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(db, FormResponsePaths.Submitted);
    batch.set(docRef, formResponse);
    batch.commit();
    formsServiceLogger.info(
      `createFormResponse: Form response submitted with formResponseId: ${docRef.id}, formResponse: ${formResponse}`
    );
    return docRef.id;
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
    const docRef = doc(db, FormResponsePaths.Submitted, formId, eventId, responseId);
    const responseSnapshot = await getDoc(docRef);

    if (!responseSnapshot.exists()) {
      throw new Error(
        `getFormResponse Error: Could not find form response with formId: ${formId}, eventId: ${eventId} and responseId: ${responseId}`
      );
    }

    const responseDoc = responseSnapshot.data() as FormResponse;
    return responseDoc;
  } catch (error) {
    formsServiceLogger.error(
      `getFormResponse Error: Error getting form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}`
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
    const docRef = doc(db, FormResponsePaths.Submitted, formId, eventId, responseId);

    const responseDocSnapshot = await getDoc(docRef);
    if (!responseDocSnapshot.exists()) {
      throw new Error(
        `Error updating form response because docRef does not exist, formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}`
      );
    }

    await updateDoc(docRef, formResponse);
  } catch (error) {
    formsServiceLogger.error(
      `updateFormResponse Error: Error editing form response with formId: ${formId}, eventId: ${eventId}, responseId: ${responseId}, updated form response: ${formResponse}, error: ${error}`
    );
    throw error;
  }
}
