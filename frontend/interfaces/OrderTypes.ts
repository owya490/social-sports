import { Timestamp } from "firebase/firestore";
import { OrderId, TicketId } from "./EventTypes";

export enum OrderAndTicketStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export enum OrderAndTicketType {
  MANUAL = "MANUAL",
  GENERAL = "GENERAL",
}

export interface Order {
  orderId: OrderId;
  applicationFees: number;
  datePurchased: Timestamp;
  discounts: number;
  email: string;
  fullName: string;
  phone: string;
  tickets: TicketId[];
  stripePaymentIntentId: string;
  status: OrderAndTicketStatus;
  type: OrderAndTicketType;
}

export const EMPTY_ORDER: Order = {
  orderId: "",
  applicationFees: 0,
  datePurchased: Timestamp.now(),
  discounts: 0,
  email: "",
  fullName: "",
  phone: "",
  tickets: [],
  stripePaymentIntentId: "",
  status: OrderAndTicketStatus.APPROVED,
  type: OrderAndTicketType.GENERAL,
};

export const OrdersCollectionPath = "Orders";
