import { PaymentSession, PaymentSessionId } from "@/interfaces/PaymentSessionTypes";
import { Logger } from "@/observability/logger";

const paymentsServiceLogger = new Logger("paymentsServiceLogger");

// export async function createNewPaymentSession(): Promise<PaymentSessionId> {
//   const paymentSessionId = uuidv4();
// }

export async function updatePaymentSession(
  paymentSessionId: PaymentSessionId,
  paymentSessionData: Partial<PaymentSession>
): Promise<void> {}
