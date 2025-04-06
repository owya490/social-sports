export const FORMS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 minutes
export const FORM_RESPONSE_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 minutes

export const FORMS_MAX_EVENTS = 5;
export const FORM_RESPONSE_MAX_EVENTS = 5;

export enum CollectionPaths {
  Forms = "Forms",
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

export enum FormPaths {
  FormsActive = `${CollectionPaths.Forms}/${FormStatus.Active}`,
  FormsDeleted = `${CollectionPaths.Forms}/${FormStatus.Deleted}`,
}

export enum FormResponsePaths {
  Submitted = `${CollectionPaths.FormResponses}/${FormResponseStatus.Submitted}`,
  Temp = `${CollectionPaths.FormResponses}/${FormResponseStatus.Temp}`,
}
export enum LocalStorageKeys {
  FormsOperationCount5Min = "formsOperationCount5Min",
  FormsLastCreateUpdateOperationTimestamp = "formsLastCreateUpdateOperationTimestamp",
  FormResponseOperationCount5Min = "formResponseOperationCount5Min",
  FormResponseLastCreateUpdateOperationTimestamp = "formResponseLastCreateUpdateOperationTimestamp",
}
