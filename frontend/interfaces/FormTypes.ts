import { UserId } from "./UserTypes";
import { Branded } from "./index";

export interface Form {
  title: FormTitle;
  userId: UserId;
  formActive: boolean;
  sectionsOrder: SectionId[]; // keeps track of ordering for editing forms
  sectionsMap: Record<SectionId, FormSection>;
}

export type FormId = Branded<string, "FormId">;
export type FormTitle = Branded<string, "FormTitle">;
export type SectionId = Branded<string, "SectionId">;
export type FormResponseId = Branded<string, "FormResponseId">;

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

type AbstractSection = {
  type: FormSectionType;
  question: string;
  imageUrl: string | null; // image attached to question
  required: boolean;
};

export type TextSection = AbstractSection & {
  type: FormSectionType.TEXT;
  answer?: string;
};

export type MultipleChoiceSection = AbstractSection & {
  type: FormSectionType.MULTIPLE_CHOICE;
  options: string[];
  answer?: string; // value of chosen option
};

export type DropdownSelectSection = AbstractSection & {
  type: FormSectionType.DROPDOWN_SELECT;
  options: string[];
  answer?: string; // value of chosen option
};

export type FileUploadSection = AbstractSection & {
  type: FormSectionType.FILE_UPLOAD;
  fileUrl?: string;
};

export type DateTimeSection = AbstractSection & {
  type: FormSectionType.DATE_TIME;
  timestamp?: string; // uct time
};

/** Contains the answers of the form from the responder */
export type FormResponse = {
  formId: FormId;
  responseMap: Record<SectionId, FormSection>;
  /** timestamp in uct; is null when stored as temp form submission */
  submissionTime?: number;
};
