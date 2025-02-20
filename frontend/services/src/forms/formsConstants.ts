export const FORMS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 minutes

export const FORMS_MAX_EVENTS = 5;

export enum CollectionPaths {
  Forms = "Forms",
}

export enum FormStatus {
  Active = "Active",
  Deleted = "Deleted",
}

export enum FormPaths {
  FormsActive = "Forms/Active",
  FormsDeleted = "Forms/Deleted",
}

export enum LocalStorageKeys {
  FormsOperationCount5Min = "formsOperationCount5Min",
  FormsLastCreateUpdateOperationTimestamp = "formsLastCreateUpdateOperationTimestamp",
}
