import { FormId } from "./FormTypes";
import { Branded } from "./index";

export type PaymentSessionId = Branded<string, "PaymentSessionId">;

export type PaymentSession = {
  /**
   * List of non-committed form submissions
   */
  tempFormIds: FormId[];
  /**
   * UTC time
   */
  paymentSessionStartTime: number;
  stripeCheckoutLink: string;
  stripeCheckoutStartTime: number;
};
