import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";

const attendeeServiceLogger = new Logger("attendeeServiceLogger");

export interface AddAttendeeRequest {
  eventId: string;
  email: string;
  fullName: string;
  phone: string;
  numTickets: number;
  price: number; // in cents
}

export interface AddAttendeeResponse {
  orderId: string;
  ticketIds: string[];
}

export async function addAttendeeViaBackend(request: AddAttendeeRequest): Promise<AddAttendeeResponse> {
  attendeeServiceLogger.info(
    `addAttendeeViaBackend: eventId=${request.eventId}, email=${request.email}, numTickets=${request.numTickets}`
  );
  try {
    const response = await executeGlobalAppControllerFunction<AddAttendeeRequest, AddAttendeeResponse>(
      EndpointType.ADD_ATTENDEE,
      request
    );
    attendeeServiceLogger.info(`addAttendeeViaBackend: success orderId=${response.orderId}`);
    return response;
  } catch (error) {
    attendeeServiceLogger.error(`addAttendeeViaBackend failed: ${error}`);
    throw error;
  }
}

export interface SetAttendeeTicketsRequest {
  eventId: string;
  orderId: string;
  numTickets: number;
}

export interface SetAttendeeTicketsResponse {
  orderId: string;
  success: boolean;
  message: string;
}

export async function setAttendeeTicketsViaBackend(
  request: SetAttendeeTicketsRequest
): Promise<SetAttendeeTicketsResponse> {
  attendeeServiceLogger.info(
    `setAttendeeTicketsViaBackend: orderId=${request.orderId}, eventId=${request.eventId}, numTickets=${request.numTickets}`
  );
  try {
    const response = await executeGlobalAppControllerFunction<SetAttendeeTicketsRequest, SetAttendeeTicketsResponse>(
      EndpointType.SET_ATTENDEE_TICKETS,
      request
    );
    attendeeServiceLogger.info(`setAttendeeTicketsViaBackend: success`);
    return response;
  } catch (error) {
    attendeeServiceLogger.error(`setAttendeeTicketsViaBackend failed: ${error}`);
    throw error;
  }
}

export interface EventAttendeeNameAndTicketCount {
  name: string;
  ticketCount: number;
}

export interface GetEventAttendeeNamesRequest {
  eventId: string;
}

export interface GetEventAttendeeNamesResponse {
  attendees: EventAttendeeNameAndTicketCount[];
}

export async function getEventAttendeeNames(eventId: string): Promise<EventAttendeeNameAndTicketCount[]> {
  attendeeServiceLogger.info(`getEventAttendeeNames: eventId=${eventId}`);
  try {
    const response = await executeGlobalAppControllerFunction<
      GetEventAttendeeNamesRequest,
      GetEventAttendeeNamesResponse
    >(EndpointType.GET_EVENT_ATTENDEE_NAMES, { eventId });
    attendeeServiceLogger.info(`getEventAttendeeNames: success, count=${response.attendees.length}`);
    return response.attendees;
  } catch (error) {
    attendeeServiceLogger.error(`getEventAttendeeNames failed: ${error}`);
    throw error;
  }
}
