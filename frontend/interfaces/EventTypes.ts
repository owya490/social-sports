import { Timestamp } from "firebase/firestore";
import { EmptyUserData, UserData } from "./UserTypes";

export type EventId = string;
export type StripeCheckoutSessionId = string;

export const INVALID_LAT = -1;
export const INVALID_LNG = -1;

export type EventAttendees = { [emailHash: string]: number };

export type EventAttendeesMetadata = {
  [emailHash: string]: {
    email: string;
    names: string[];
    phones: string[];
  };
};

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
  image: string; // Assuming you store the image URL or path as a string
  eventTags: string[]; // Assuming "list of tags" is an array of strings
  isActive: boolean;
  isPrivate: boolean;
<<<<<<< HEAD
  attendees: Record<string, number>; // Key is Email and Number is amount of tickets associated with the email
  attendeesMetadata: Record<string, { names: string[]; phones: string[] }>; // keeping track of an array with names and phones provided
=======
  attendees: EventAttendees;
  attendeesMetadata: EventAttendeesMetadata;
>>>>>>> 15ce93efb0a88419f57cb426842b0c747f5d2d93
  accessCount: number;
  sport: string;
}

export interface EventsMetadata {
  eventId: EventId;
  attendees: Record<string, EventsAttendeeMetadata>;
  completedStripeCheckoutSessionIds: StripeCheckoutSessionId[];
}

export interface EventsAttendeeMetadata {
  email: string;
  names: string[];
  phones: string[];
  ticketCount: number;
}

export interface NewEventData extends AbstractEventData {}

export interface EventData extends AbstractEventData {
  eventId: EventId;
  organiser: UserData;
}

export interface EventDataWithoutOrganiser extends AbstractEventData {
  eventId: EventId;
}

export const EmptyEventData: EventData = {
  eventId: "",
  organiser: EmptyUserData,
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
  eventTags: [],
  isActive: false,
  attendees: {},
  attendeesMetadata: {},
  accessCount: 0,
  sport: "",
  isPrivate: false,
};
