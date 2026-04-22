export class RecurrenceTemplateInConflictError extends Error {
  readonly blockingEventCollectionIds: string[];
  readonly blockingCustomEventLinkPaths: string[];

  constructor(
    message: string,
    blockingEventCollectionIds: string[],
    blockingCustomEventLinkPaths: string[]
  ) {
    super(message);
    this.name = "RecurrenceTemplateInConflictError";
    this.blockingEventCollectionIds = blockingEventCollectionIds;
    this.blockingCustomEventLinkPaths = blockingCustomEventLinkPaths;
  }
}
