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
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { CollectionPaths, FormPaths, FormStatus } from "./formsConstants";
import { rateLimitCreateForm } from "./formsUtils/createFormUtils";

export const formsServiceLogger = new Logger("formsServiceLogger");

export async function createForm(form: Form): Promise<FormId> {
  // TODO: implement rate limiting
  if (!rateLimitCreateForm()) {
    formsServiceLogger.warn("Rate Limited!!!");
  }
  formsServiceLogger.info(`createForm: ${form}`);
  try {
    const batch = writeBatch(db);
    const docRef = doc(db, CollectionPaths.Forms, FormStatus.Active);
    batch.set(docRef, form);
    batch.commit();
    formsServiceLogger.info(`Form created successfully: ${form}`);

    return docRef.id;
  } catch (error) {
    formsServiceLogger.error(`createForm: ${error}`);
    throw error;
  }
}

export async function getForm(formId: FormId): Promise<Form> {
  // TODO:
  try {
    const formDocRef = doc(db, `${FormPaths.FormsActive}`, formId);
    const formDoc = await getDoc(formDocRef);

    // Check if the document exists in the current subcollection
    if (formDoc.exists()) {
      formsServiceLogger.info(`Found form document reference for formId: ${formId}`);
      return formDoc.data() as Form;
    }

    // if no document found, log and throw an error
    formsServiceLogger.error(`Form document not found for formId: ${formId}`);
    throw new Error(`Error finding form document with formId: ${formId}`);
  } catch (error) {
    formsServiceLogger.error(`Error getting form for formId: ${formId}, error: ${error}`);
    throw error;
  }
}

export async function editForm(formData: Partial<Form>, formId: FormId): Promise<void> {
  // TODO:
}

export async function archiveForm(formId: FormId): Promise<void> {
  // TODO:
}

export async function deleteForm(formId: FormId): Promise<void> {
  // TODO:
}

export async function createFormResponse(formResponse: FormResponse): Promise<FormResponseId> {
  // TODO:
  return "";
}

export async function getFormResponse(formId: FormId, responseId: FormResponseId): Promise<FormResponse> {
  // TODO:
  return {
    formId: "",
    responseMap: new Map<SectionId, FormSection>(),
    submissionTime: Date.now(),
  };
}

export async function editFormResponse(
  formId: FormId,
  responseId: FormResponseId,
  formResponse: FormResponse
): Promise<void> {
  // TODO:
}

export async function deleteFormResponse(formId: FormId, responseId: FormResponseId): Promise<void> {
  // TODO:
}
