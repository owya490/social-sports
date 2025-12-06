import { Timestamp } from "firebase/firestore";
import { FormId } from "./FormTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "./UserTypes";

export type EventId = string;
export type StripeCheckoutSessionId = string;

export type OrderId = string;
export type TicketId = string;

export const INVALID_LAT = -1;
export const INVALID_LNG = -1;

export type EventAttendees = { [emailHash: string]: number };

interface AbstractEventData {
  startDate: Timestamp;
  endDate: Timestamp;
  location: string; // Assuming "address" is a string
  locationLatLng: {
    lat: number;
    lng: number;
  };
  capacity: number;
  vacancy: number;
  price: number;
  organiserId: string;
  registrationDeadline: Timestamp;
  name: string;
  description: string;
  nameTokens?: string[]; // Assuming "rich text field" is a string
  locationTokens?: string[];
  image: string; // Assuming you store the image URL or path as a string
  thumbnail: string;
  eventTags: string[]; // Assuming "list of tags" is an array of strings
  isActive: boolean;
  isPrivate: boolean;
  attendees: Record<string, number>; // Key is Email and Number is amount of tickets associated with the email
  attendeesMetadata: Record<string, { names: string[]; phones: string[] }>; // keeping track of an array with names and phones provided
  accessCount: number;
  sport: string;
  paymentsActive: boolean;
  stripeFeeToCustomer: boolean; // should default to false
  promotionalCodesEnabled: boolean; // should default to false
  paused: boolean; // should default to false
  eventLink: string;
  formId: FormId | null;
  hideVacancy: boolean; // should default to false
}

export interface NewEventData extends AbstractEventData {}

export interface EventData extends AbstractEventData {
  eventId: EventId;
  organiser: PublicUserData;
}

export interface EventDataWithoutOrganiser extends AbstractEventData {
  eventId: EventId;
}

export interface DeletedEvent extends AbstractEventData {
  deletedAt: Timestamp;
  organiserEmail: string;
}

export const EmptyEventData: EventData = {
  eventId: "",
  organiser: EmptyPublicUserData,
  startDate: new Timestamp(0, 0),
  endDate: new Timestamp(0, 0),
  location: "",
  locationLatLng: {
    lat: INVALID_LAT,
    lng: INVALID_LNG,
  },
  capacity: 0,
  vacancy: 0,
  price: 0,
  organiserId: "",
  registrationDeadline: new Timestamp(0, 0),
  name: "",
  description: "",
  image: "",
  thumbnail: "",
  eventTags: [],
  isActive: false,
  attendees: {},
  attendeesMetadata: {},
  accessCount: 0,
  sport: "",
  isPrivate: false,
  paymentsActive: false,
  stripeFeeToCustomer: false,
  promotionalCodesEnabled: false,
  paused: false,
  eventLink: "",
  formId: null,
  hideVacancy: false,
};

export interface EventMetadata {
  eventId?: EventId;
  purchaserMap: Record<EmailHash, Purchaser>;
  completeTicketCount: number;
  completedStripeCheckoutSessionIds: StripeCheckoutSessionId[];
  organiserId: UserId;
  orderIds: OrderId[];
}

export const EmptyEventMetadata: EventMetadata = {
  eventId: "",
  purchaserMap: {
    "": { email: "", attendees: { "": { phone: "", ticketCount: 0, formResponseIds: [] } }, totalTicketCount: 0 },
  },
  completeTicketCount: 0,
  completedStripeCheckoutSessionIds: [],
  organiserId: "",
  orderIds: [],
};

export interface Purchaser {
  email: string;
  attendees: Record<Name, Attendee>;
  totalTicketCount: number;
}

export interface Attendee {
  phone: string;
  ticketCount: number;
  formResponseIds?: string[];
}

export type Name = string;
type EmailHash = string;

export enum SearchType {
  EVENT,
  USER,
}
