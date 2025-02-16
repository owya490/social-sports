import { Timestamp } from "firebase/firestore";
import { EmptyUserData, UserData, UserId } from "./UserTypes";

export type EventId = string;
export type StripeCheckoutSessionId = string;
export type OrderId = string;

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
  purchaserMap: { "": { email: "", attendees: { "": { phone: "", ticketCount: 0 } }, totalTicketCount: 0 } },
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
}

export type Name = string;
type EmailHash = string;

export class SerializedEventData implements Omit<EventData, "startDate" | "endDate" | "registrationDeadline"> {
  eventId: string;
  organiser: UserData;
  organiserId: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  name: string;
  description: string;
  location: string;
  image: string;
  thumbnail: string;
  eventTags: string[];
  isActive: boolean;
  isPrivate: boolean;
  attendees: Record<string, number>;
  attendeesMetadata: Record<string, { names: string[]; phones: string[] }>;
  accessCount: number;
  sport: string;
  paymentsActive: boolean;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  paused: boolean;
  locationLatLng: { lat: number; lng: number };
  capacity: number;
  vacancy: number;
  price: number;
  nameTokens?: string[] | undefined;
  locationTokens?: string[] | undefined;

  constructor(eventData: EventData, eventId: string) {
    this.eventId = eventId;
    this.organiserId = eventData.organiserId;
    this.organiser = eventData.organiser;
    this.startDate = eventData.startDate.toDate().toISOString(); // Convert Timestamp to ISO string
    this.endDate = eventData.endDate.toDate().toISOString(); // Convert Timestaamp to ISO string
    this.registrationDeadline = eventData.registrationDeadline.toDate().toISOString(); // Convert Timestamp to ISO string
    this.name = eventData.name;
    this.description = eventData.description;
    this.location = eventData.location;
    this.image = eventData.image;
    this.thumbnail = eventData.thumbnail;
    this.eventTags = eventData.eventTags;
    this.isActive = eventData.isActive;
    this.isPrivate = eventData.isPrivate;
    this.attendees = eventData.attendees;
    this.attendeesMetadata = eventData.attendeesMetadata;
    this.accessCount = eventData.accessCount;
    this.sport = eventData.sport;
    this.paymentsActive = eventData.paymentsActive;
    this.stripeFeeToCustomer = eventData.stripeFeeToCustomer;
    this.promotionalCodesEnabled = eventData.promotionalCodesEnabled;
    this.paused = eventData.paused;
    this.locationLatLng = eventData.locationLatLng;
    this.capacity = eventData.capacity;
    this.vacancy = eventData.vacancy;
    this.price = eventData.price;
  }

  unserialize(): EventData {
    return {
      eventId: this.eventId,
      organiserId: this.organiserId,
      organiser: this.organiser,
      startDate: Timestamp.fromDate(new Date(this.startDate)),
      endDate: Timestamp.fromDate(new Date(this.endDate)),
      registrationDeadline: Timestamp.fromDate(new Date(this.registrationDeadline)),
      name: this.name,
      description: this.description,
      location: this.location,
      image: this.image,
      thumbnail: this.thumbnail,
      eventTags: this.eventTags,
      isActive: this.isActive,
      isPrivate: this.isPrivate,
      attendees: this.attendees,
      attendeesMetadata: this.attendeesMetadata,
      accessCount: this.accessCount,
      sport: this.sport,
      paymentsActive: this.paymentsActive,
      stripeFeeToCustomer: this.stripeFeeToCustomer,
      promotionalCodesEnabled: this.promotionalCodesEnabled,
      paused: this.paused,
      locationLatLng: this.locationLatLng,
      capacity: this.capacity,
      vacancy: this.vacancy,
      price: this.price,
      nameTokens: this.nameTokens,
      locationTokens: this.locationTokens,
    };
  }
}
