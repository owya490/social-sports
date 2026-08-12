import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { DEFAULT_MAX_TICKETS_PER_ORDER } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { DEFAULT_RECURRENCE_FORM_DATA, NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";

export type CreateEventFormData = {
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  location: string;
  sport: string;
  price: number;
  capacity: number;
  name: string;
  description: string;
  image: string | undefined;
  thumbnail: string | undefined;
  tags: string[];
  isPrivate: boolean;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  paymentsActive: boolean;
  lat: number;
  lng: number;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  paused: boolean;
  eventLink: string;
  newRecurrenceData: NewRecurrenceFormData;
  hideVacancy: boolean;
  formId: FormId | null;
  waitlistEnabled: boolean;
  bookingApprovalEnabled: boolean;
  showAttendeesOnEventPage: boolean;
  maxTicketsPerTransaction: number;
};

/** @deprecated Prefer CreateEventFormData — kept for existing BasicForm imports via page re-export if needed */
export type FormData = CreateEventFormData;

export const CREATE_EVENT_INITIAL_DATA: CreateEventFormData = {
  startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  registrationEndDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  location: "",
  sport: SPORTS_CONFIG.volleyball.value,
  price: 1500, // $15 default price, set to 1500 as it is in cents
  capacity: 20,
  name: "",
  description: "",
  image: undefined,
  thumbnail: undefined,
  tags: [],
  isPrivate: false,
  startTime: "10:00",
  endTime: "10:00",
  registrationEndTime: "10:00",
  paymentsActive: true,
  lat: 0,
  lng: 0,
  stripeFeeToCustomer: true,
  promotionalCodesEnabled: false,
  paused: true, // Registration starts closed until organiser resumes
  eventLink: "",
  newRecurrenceData: DEFAULT_RECURRENCE_FORM_DATA,
  hideVacancy: false,
  formId: null,
  waitlistEnabled: true,
  bookingApprovalEnabled: false,
  showAttendeesOnEventPage: false,
  maxTicketsPerTransaction: DEFAULT_MAX_TICKETS_PER_ORDER,
};
