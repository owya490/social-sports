export type CustomEventLinkType = "event" | "recurring";

export interface CustomEventLink {
  id: string;
  customEventLinkName: string;
  customEventLink: string;
  referenceId: string | null;
  referenceName: string | null;
  type: CustomEventLinkType;
}

export const EMPTY_CUSTOM_EVENT_LINK: CustomEventLink = {
  id: "",
  customEventLinkName: "",
  customEventLink: "",
  referenceId: null,
  referenceName: null,
  type: "event",
};
