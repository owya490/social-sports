import emailjs from "emailjs-com";
import { Logger } from "@/observability/logger";

export const emailJSLogger = new Logger("emailJSLogger");

type SuggestionsTemplateParams = Record<string, string>;

// Configuration for EmailJS
const serviceId = process.env.NEXT_PUBLIC_EMAILJS_PROD_SERVICE_ID;
const templateId = process.env.NEXT_PUBLIC_EMAILJS_PROD_TEMPLATE_ID;
const userId = process.env.NEXT_PUBLIC_EMAILJS_PROD_USER_ID;

export const sendEmail = async (templateParams: SuggestionsTemplateParams) => {
  if (!serviceId || !templateId || !userId) {
    emailJSLogger.error("Missing necessary environment variables for EmailJS.");
    throw new Error("Missing necessary environment variables for EmailJS.");
  }

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, userId);
    emailJSLogger.info(`SUCCESS! Status: ${response.status}, Text: ${response.text}`);
    return response;
  } catch (err) {
    emailJSLogger.error(`Error: ${err}. Failed to send email.`);
    throw err;
  }
};
