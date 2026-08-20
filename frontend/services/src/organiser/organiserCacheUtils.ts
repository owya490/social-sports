import { Timestamp } from "firebase/firestore";
import { ORGANISER_EVENTS_REFRESH_MILLIS } from "./organiserConstants";

export function canUseLocalStorage(): boolean {
  try {
    return typeof globalThis !== "undefined" && globalThis.localStorage != null;
  } catch {
    return false;
  }
}

export function isOrganiserCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ORGANISER_EVENTS_REFRESH_MILLIS;
}

export function toCacheTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const stamp = value as { seconds: number; nanoseconds?: number };
    return new Timestamp(stamp.seconds, stamp.nanoseconds ?? 0);
  }
  return new Timestamp(0, 0);
}

export function readJsonLocalStorage<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonLocalStorage(key: string, value: unknown): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private-mode writes can fail; memory cache still serves this session.
  }
}

export function removeLocalStorageKey(key: string): void {
  if (!canUseLocalStorage()) {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage access failures on bust.
  }
}
