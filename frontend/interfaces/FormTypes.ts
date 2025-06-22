import { EventId } from "./EventTypes";
import { UserId } from "./UserTypes";

export interface Form {
  title: FormTitle;
  userId: UserId;
  formActive: boolean;
  sectionsOrder: SectionId[]; // keeps track of ordering for editing forms
  sectionsMap: Map<SectionId, FormSection>;
}

export type FormId = string;
export type FormTitle = string;
export type SectionId = string;
export type FormResponseId = string;

export type FormSection =
  | TextSection
  | MultipleChoiceSection
  | DropdownSelectSection
  | FileUploadSection
  | DateTimeSection;

export enum FormSectionType {
  TEXT = "TEXT",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  DROPDOWN_SELECT = "DROPDOWN_SELECT",
  BINARY_CHOICE = "BINARY_CHOICE",
  FILE_UPLOAD = "FILE_UPLOAD",
  DATE_TIME = "DATE_TIME",
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

export interface FileUploadSection extends AbstractSection {
  type: FormSectionType.FILE_UPLOAD;
  fileUrl?: string;
}

export interface DateTimeSection extends AbstractSection {
  type: FormSectionType.DATE_TIME;
  timestamp?: string; // uct time
}

/** Contains the answers of the form from the responder */
export interface FormResponse {
  formId: FormId;
  eventId: EventId;
  responseMap: Map<SectionId, FormSection>;
  /** timestamp in uct; is null when stored as temp form submission */
  submissionTime?: number;
}
