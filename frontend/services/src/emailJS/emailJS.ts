// emailService.ts
import emailjs from "emailjs-com";
import { Logger } from "@/observability/logger";

export const emailJSLogger = new Logger("emailJSLogger");

// Define the type for TemplateParams using Record
type TemplateParams = Record<string, string>;

// Configuration for EmailJS
const serviceId = process.env.REACT_APP_EMAILJS_PROD_SERVICE_ID;
const templateId = process.env.REACT_APP_EMAILJS_PROD_TEMPLATE_ID;
const userId = process.env.REACT_APP_EMAILJS_PROD_USER_ID;


export const sendEmail = async (templateParams: TemplateParams) => {
  // Log environment variables to verify their values
  console.log('Service ID:', serviceId);
  console.log('Template ID:', templateId);
  console.log('User ID:', userId);

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


