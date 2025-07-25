export const FORMS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 minutes
export const FORM_RESPONSE_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 minutes

export const FORMS_MAX_EVENTS = 5;
export const FORM_RESPONSE_MAX_EVENTS = 5;

export const FormsRootPath = "Forms";

export enum FormPaths {
  FormTemplates = "FormTemplates",
  FormResponses = "FormResponses",
}

export enum FormStatus {
  Active = "Active",
  Deleted = "Deleted",
}

export enum FormResponseStatus {
  Submitted = "Submitted",
  Temp = "Temp",
}

/**
 * A const object is used here instead of enum due to the way TypeScript reverse maps
 * string enums containing interpolated values.
 */
export const FormTemplatePaths = {
  FormsActive: `${FormsRootPath}/${FormPaths.FormTemplates}/${FormStatus.Active}`,
  FormsDeleted: `${FormsRootPath}/${FormPaths.FormTemplates}/${FormStatus.Deleted}`,
} as const;

export type FormTemplatePath = (typeof FormTemplatePaths)[keyof typeof FormTemplatePaths];

/**
 * Same as the above.
 */
export const FormResponsePaths = {
  Submitted: `${FormsRootPath}/${FormPaths.FormResponses}/${FormResponseStatus.Submitted}`,
  Temp: `${FormsRootPath}/${FormPaths.FormResponses}/${FormResponseStatus.Temp}`,
} as const;

export type FormResponsePath = (typeof FormResponsePaths)[keyof typeof FormResponsePaths];

export enum LocalStorageKeys {
  FormsOperationCount5Min = "formsOperationCount5Min",
  FormsLastCreateUpdateOperationTimestamp = "formsLastCreateUpdateOperationTimestamp",
  FormResponseOperationCount5Min = "formResponseOperationCount5Min",
  FormResponseLastCreateUpdateOperationTimestamp = "formResponseLastCreateUpdateOperationTimestamp",
}
