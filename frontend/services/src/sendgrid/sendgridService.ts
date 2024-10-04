import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT,
  getFirebaseFunctionByName,
  FIREBASE_FUNCTIONS_DELETE_EVENT_EMAIL_FOR_ORGANISER,
} from "../firebaseFunctionsService";

const sendgridServiceLogger = new Logger("sendgridServiceLogger");

interface SendgridSendEmailResponse {
  status: number;
}

// Function to send email when an event is created
export async function sendEmailOnCreateEvent(eventId: string, visibility: string) {
  const content = {
    eventId: eventId,
    visibility: visibility,
  };

  const sendEmailFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT);
  return sendEmailFunction(content)
    .then((result) => {
      const data = JSON.parse(result.data as string) as SendgridSendEmailResponse;
      return data.status;
    })
    .catch((error) => {
      sendgridServiceLogger.warn(`Failed to send email on event creation. eventId=${eventId} error=${error}`);
      throw Error("Sendgrid failed");
    });
}

// Function to send email when an event is deleted
export async function sendEmailforDeleteOrganiser(eventId: string) {
  const content = {
    eventId: eventId,
  };

  // Use the correct Firebase function for deleting event emails
  const sendEmailFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_DELETE_EVENT_EMAIL_FOR_ORGANISER);
  return sendEmailFunction(content)
    .then((result) => {
      const data = JSON.parse(result.data as string) as SendgridSendEmailResponse;
      return data.status;
    })
    .catch((error) => {
      sendgridServiceLogger.warn(`Failed to send email on event deletion. eventId=${eventId} error=${error}`);
      throw Error("Sendgrid failed");
    });
}
