import { Timestamp } from "firebase/firestore";
import { OrderId, TicketId } from "./EventTypes";

export interface Order {
  orderId: OrderId;
  applicationFees: number;
  datePurchased: Timestamp;
  discounts: number;
  email: string;
  fullName: string;
  phone: string;
  tickets: TicketId[];
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
};

export const OrderCollectionPath = "Orders";
