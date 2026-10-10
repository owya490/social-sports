import { EventId, TeamBoard } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { doc, onSnapshot, setDoc, Unsubscribe } from "firebase/firestore";
import { db } from "../../firebase";
import { CollectionPaths } from "../eventsConstants";
import { teamBoardFromStored } from "./teamBoardDocument";

const eventTeamsLogger = new Logger("eventTeamsService");

/**
 * Team layouts are stored in EventTeams/{eventId}.
 * EventsMetadata is rewritten in full by ticket webhooks, so a board stored there would be deleted
 * on the next paid checkout, cancellation, or expired-session restock.
 */
function eventTeamDocRef(eventId: EventId) {
  return doc(db, CollectionPaths.EventTeams, eventId);
}

export async function saveEventTeamBoard(eventId: EventId, board: TeamBoard): Promise<void> {
  eventTeamsLogger.info(`saveEventTeamBoard, ${eventId}`);
  try {
    await setDoc(eventTeamDocRef(eventId), board);
  } catch (error) {
    eventTeamsLogger.error(`saveEventTeamBoard ${error}`);
    throw error;
  }
}

export function subscribeToEventTeamBoard(
  eventId: EventId,
  onChange: (board: TeamBoard) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  eventTeamsLogger.info(`subscribeToEventTeamBoard, ${eventId}`);
  return onSnapshot(
    eventTeamDocRef(eventId),
    (snapshot) => {
      onChange(teamBoardFromStored(snapshot.exists() ? snapshot.data() : undefined));
    },
    (error) => {
      eventTeamsLogger.error(`Event teams subscription failed for ${eventId}: ${error}`);
      onError?.(error);
    }
  );
}
