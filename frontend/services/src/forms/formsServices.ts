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

export async function createForm(form: Form): Promise<void> {
  // TODO:
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

export async function getFormResponse(
  formId: FormId,
  userId: UserId,
  responseId: FormResponseId
): Promise<FormResponse> {
  // TODO:
  return {
    formId: "",
    userId: "",
    responseMap: new Map<SectionId, Map<FormSectionType, FormSection>>(),
    submissionTime: Date.now(),
  };
}

export async function editFormResponse(
  formId: FormId,
  userId: UserId,
  responseId: FormResponseId,
  formResponse: FormResponse
): Promise<void> {
  // TODO:
}

export async function deleteFormResponse(formId: FormId, userId: UserId, responseId: FormResponseId): Promise<void> {
  // TODO:
}
