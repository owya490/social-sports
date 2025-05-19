import { FormId } from "./FormTypes";
import { Branded } from "./index";

export type FulfilmentSessionId = Branded<string, "FulfilmentSessionId">;

export type FulfilmentSession = {
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
