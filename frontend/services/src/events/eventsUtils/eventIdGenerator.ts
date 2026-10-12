import { EventId } from "@/interfaces/EventTypes";
import { monotonicFactory } from "ulid";

/** Must match Java `EventIdGenerator`: `evt_` plus a 26-character ULID. */
const EVENT_ID_PREFIX = "evt_";
const nextUlid = monotonicFactory();

export function newEventId(): EventId {
  return `${EVENT_ID_PREFIX}${nextUlid()}` as EventId;
}
