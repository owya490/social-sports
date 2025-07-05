export type CustomEventLinkType = "event" | "recurring";

export interface CustomEventLink {
  id: string;
  customEventLinkName: string;
  customEventLink: string;
  eventReference: string | null;
  referenceId: string | null;
  referenceName: string | null;
  type: CustomEventLinkType;
}

export const EMPTY_CUSTOM_EVENT_LINK: CustomEventLink = {
  id: "",
  customEventLinkName: "",
  customEventLink: "",
  eventReference: null,
  referenceId: null,
  referenceName: null,
  type: "event",
};
