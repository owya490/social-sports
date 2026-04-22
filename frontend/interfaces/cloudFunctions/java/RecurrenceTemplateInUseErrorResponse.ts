export type RecurrenceTemplateInUseErrorResponse = {
  errorMessage: string;
  blockingEventCollectionIds: string[];
  blockingCustomEventLinkPaths: string[];
};
