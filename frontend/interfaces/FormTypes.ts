import { Timestamp } from "firebase/firestore";
import { EventId } from "./EventTypes";
import { UserId } from "./UserTypes";
import { Branded } from "./index";

export interface Form {
  formId: FormId;
  title: FormTitle;
  description: FormDescription;
  userId: UserId;
  formActive: boolean;
  sectionsOrder: SectionId[]; // keeps track of ordering for editing forms
  sectionsMap: Record<SectionId, FormSection>;
  lastUpdated: Timestamp | null;
}

export type FormId = Branded<string, "FormId">;
export type FormTitle = Branded<string, "FormTitle">;
export type FormDescription = Branded<string, "FormDescription">;
export type SectionId = Branded<string, "SectionId">;
export type FormResponseId = Branded<string, "FormResponseId">;

export type FormSection =
  | TextSection
  | MultipleChoiceSection
  | DropdownSelectSection
  | TickboxSection
  | FileUploadSection
  | DateTimeSection
  | ImageSection;

export enum FormSectionType {
  TEXT = "TEXT",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  DROPDOWN_SELECT = "DROPDOWN_SELECT",
  TICKBOX = "TICKBOX",
  BINARY_CHOICE = "BINARY_CHOICE",
  FILE_UPLOAD = "FILE_UPLOAD",
  DATE_TIME = "DATE_TIME",
  IMAGE = "IMAGE",
}

interface AbstractSection {
  type: FormSectionType;
  question: string;
  imageUrl: string | null; // image attached to question
  required: boolean;
}

export interface TextSection extends AbstractSection {
  type: FormSectionType.TEXT;
  answer?: string;
}

export interface MultipleChoiceSection extends AbstractSection {
  type: FormSectionType.MULTIPLE_CHOICE;
  options: string[];
  answer?: string; // value of chosen option
}

export interface DropdownSelectSection extends AbstractSection {
  type: FormSectionType.DROPDOWN_SELECT;
  options: string[];
  answer?: string; // value of chosen option
}

export interface TickboxSection extends AbstractSection {
  type: FormSectionType.TICKBOX;
  options: string[];
  answer?: string[];
}

export interface FileUploadSection extends AbstractSection {
  type: FormSectionType.FILE_UPLOAD;
  fileUrl?: string;
}

export interface DateTimeSection extends AbstractSection {
  type: FormSectionType.DATE_TIME;
  timestamp?: string; // uct time
}

export interface ImageSection extends AbstractSection {
  type: FormSectionType.IMAGE;
  imageUrl: string;
}

/** Contains the answers of the form from the responder */
export interface FormResponse {
  formId: FormId;
  eventId: EventId;
  formResponseId: FormResponseId;
  responseSectionsOrder: SectionId[];
  responseMap: Record<SectionId, FormSection>;
  /** timestamp in uct; is null when stored as temp form submission */
  submissionTime: Timestamp | null;
}

export const EmptyForm: Form = {
  formId: "" as FormId,
  title: "" as FormTitle,
  description: "" as FormDescription,
  userId: "" as UserId,
  formActive: true,
  sectionsOrder: [],
  sectionsMap: {},
  lastUpdated: null,
};

export const EmptyFormResponse: FormResponse = {
  formId: "" as FormId,
  eventId: "" as EventId,
  formResponseId: "" as FormResponseId,
  responseSectionsOrder: [],
  responseMap: {},
  submissionTime: null,
};

/**
 * Payload we send to java saveTempFormResponse function
 */
export type SaveTempFormResponseRequest = {
  formResponse: FormResponse;
};

/**
 * Payload we receive from java saveTempFormResponse function
 */
export type SaveTempFormResponseResponse = {
  formResponseId: FormResponseId;
};
