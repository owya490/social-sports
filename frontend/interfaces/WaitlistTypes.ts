import { EventId } from "./EventTypes";
import { Branded } from "./index";

/**
 * Waitlist Database Schema:
 *
 * Waitlist (collection)
 * └── {eventId} (document)
 *     └── WaitlistPool (map)
 *         └── {emailHash} (map entry)
 *             ├── name: string
 *             ├── email: string
 *             ├── notifiedAt: number (unix timestamp)
 *             └── ticketCount: number
 */

// ============================================
// Core Types
// ============================================

/**
 * Hash of the user's email - used as key in WaitlistPool map
 */
export type EmailHash = Branded<string, "EmailHash">;

/**
 * Individual waitlist entry for a user
 */
export interface WaitlistEntry {
  name: string;
  email: string;
  /** Unix timestamp - when we last notified them (to prevent spam) */
  notifiedAt: number | null;
  ticketCount: number;
}

/**
 * Map of email hashes to waitlist entries
 */
export interface WaitlistPool {
  [emailHash: string]: WaitlistEntry;
}

/**
 * Firestore document structure for a waitlist (one per event)
 */
export interface WaitlistDocument {
  WaitlistPool: WaitlistPool;
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Request payload to join a waitlist
 */
export interface JoinWaitlistRequest {
  eventId: EventId;
  name: string;
  email: string;
  ticketCount: number;
}

/**
 * Response from joining a waitlist
 */
export interface JoinWaitlistResponse {
  success: boolean;
  message: string;
}

/**
 * Request to check waitlist status
 */
export interface GetWaitlistStatusRequest {
  eventId: EventId;
  email: string;
}

/**
 * Response with waitlist status
 */
export interface GetWaitlistStatusResponse {
  isOnWaitlist: boolean;
  entry?: WaitlistEntry;
  position?: number;
}

/**
 * Request to remove from waitlist
 */
export interface LeaveWaitlistRequest {
  eventId: EventId;
  email: string;
}
