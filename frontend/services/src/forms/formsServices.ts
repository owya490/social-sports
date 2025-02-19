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
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { CollectionPaths, FormStatus } from "./formsConstants";

export const formsServiceLogger = new Logger("formsServiceLogger");

export async function createForm(form: Form): Promise<void> {
  // TODO: implement rate limiting
  formsServiceLogger.info(`createForm: ${form}`);

  try {
    const batch = writeBatch(db);
    const docRef = doc(db, CollectionPaths.Forms, FormStatus.Active);
    batch.set(docRef, form);
    batch.commit();
    formsServiceLogger.info(`Form created successfully: ${form}`);
  } catch (error) {
    formsServiceLogger.error(`createForm: ${error}`);
  }
}

export async function getForm(formId: FormId): Promise<Form> {
  // TODO:
  return {
    title: "",
    sectionsOrder: [],
    sectionsMap: new Map<SectionId, FormSection>(),
  };
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
