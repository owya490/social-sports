import { FulfilmentSession, FulfilmentSessionId } from "@/interfaces/FulfilmentSessionTypes";
import { Logger } from "@/observability/logger";

const fulfilmentServiceLogger = new Logger("fulfilmentServiceLogger");

// export async function createNewPaymentSession(): Promise<PaymentSessionId> {
//   const paymentSessionId = uuidv4();
// }

export async function updateFulfilmentSession(
  paymentSessionId: FulfilmentSessionId,
  paymentSessionData: Partial<FulfilmentSession>
): Promise<void> {}
