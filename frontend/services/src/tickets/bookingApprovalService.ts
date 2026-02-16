import { EndpointType } from "@/interfaces/FunctionsTypes";
import { Logger } from "@/observability/logger";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";

const bookingApprovalServiceLogger = new Logger("bookingApprovalService");

export enum BookingApprovalOperation {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

interface BookingApprovalRequest {
  eventId: string;
  organiserId: string;
  orderId: string;
  bookingApprovalOperation: BookingApprovalOperation;
}

interface BookingApprovalResponse {
  success: boolean;
  orderId: string;
  bookingApprovalOperation: BookingApprovalOperation;
  message: string;
}

export async function approveBooking(eventId: string, organiserId: string, orderId: string): Promise<BookingApprovalResponse> {
  bookingApprovalServiceLogger.info(`approveBooking: eventId=${eventId}, organiserId=${organiserId}, orderId=${orderId}`);

  try {
    const response = await executeGlobalAppControllerFunction<BookingApprovalRequest, BookingApprovalResponse>(
      EndpointType.BOOKING_APPROVAL,
      {
        eventId,
        organiserId,
        orderId,
        bookingApprovalOperation: BookingApprovalOperation.APPROVE,
      }
    );

    bookingApprovalServiceLogger.info(`approveBooking: Successfully approved orderId=${orderId}`);
    return response;
  } catch (error) {
    bookingApprovalServiceLogger.error(`approveBooking: Failed to approve orderId=${orderId}: ${error}`);
    throw error;
  }
}

export async function rejectBooking(eventId: string, organiserId: string, orderId: string): Promise<BookingApprovalResponse> {
  bookingApprovalServiceLogger.info(`rejectBooking: eventId=${eventId}, organiserId=${organiserId}, orderId=${orderId}`);

  try {
    const response = await executeGlobalAppControllerFunction<BookingApprovalRequest, BookingApprovalResponse>(
      EndpointType.BOOKING_APPROVAL,
      {
        eventId,
        organiserId,
        orderId,
        bookingApprovalOperation: BookingApprovalOperation.REJECT,
      }
    );

    bookingApprovalServiceLogger.info(`rejectBooking: Successfully rejected orderId=${orderId}`);
    return response;
  } catch (error) {
    bookingApprovalServiceLogger.error(`rejectBooking: Failed to reject orderId=${orderId}: ${error}`);
    throw error;
  }
}
