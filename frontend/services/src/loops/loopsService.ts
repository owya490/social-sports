import { Logger } from "@/observability/logger";
import {
  FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT_V2,
  getFirebaseFunctionByName,
} from "../firebaseFunctionsService";

const loopsServiceLogger = new Logger("loopsServiceLogger");

interface LoopsSendEmailOnCreateEvent {
  message: string;
  status: number;
  success: boolean;
}

export async function sendEmailOnCreateEventV2(eventId: string, visibility: string) {
  const content = {
    eventId: eventId,
    visibility: visibility,
  };

  const sendEmailFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_SEND_EMAIL_ON_CREATE_EVENT_V2);
  return sendEmailFunction(content)
    .then((result) => {
      const data = result.data as LoopsSendEmailOnCreateEvent;
      return data.status;
    })
    .catch((error) => {
    loopsServiceLogger.warn(`Failed to send email on event creation. eventId=${eventId} error=${error}`);
      throw Error("Loops failed");
    });
}