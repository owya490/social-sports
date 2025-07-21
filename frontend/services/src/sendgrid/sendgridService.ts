import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT,
  FIREBASE_FUNCTIONS_SEND_EMAIL_ON_DELETE_EVENT,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";

const sendgridServiceLogger = new Logger("sendgridServiceLogger");

interface SendgridSendEmailOnCreateEvent {
  message: string;
  status: number;
  success: boolean;
}

export async function sendEmailOnCreateEvent(eventId: string, visibility: string) {
  const content = {
    eventId: eventId,
    visibility: visibility,
  };

  const sendEmailFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT);
  return sendEmailFunction(content)
    .then((result) => {
      const data = result.data as SendgridSendEmailOnCreateEvent;
      return data.status;
    })
    .catch((error) => {
      sendgridServiceLogger.warn(`Failed to send email on event creation. eventId=${eventId} error=${error}`);
      throw Error("Sendgrid failed");
    });
}

export async function sendEmailOnDeleteEvent(eventId: string) {
  const sendEmailFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_SEND_EMAIL_ON_DELETE_EVENT);

  const content = {
    eventId: eventId,
  };
  return sendEmailFunction(content)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      sendgridServiceLogger.warn(`Failed to send email on event creation. eventId=${eventId} error=${error}`);
      throw Error("Sendgrid failed");
    });
}
