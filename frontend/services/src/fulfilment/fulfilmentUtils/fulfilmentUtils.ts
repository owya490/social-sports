import { EventId } from "@/interfaces/EventTypes";
import { FulfilmentEntity, FulfilmentSession, FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { UTCTime } from "@/interfaces/Types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../firebase";
import { fulfilmentSessionsRootPath } from "../fulfilmentConstants";
import { fulfilmentServiceLogger } from "../fulfilmentServices";

/**
 * NOTE: Do NOT use this function directly. Fulfilment sessions should be managed through `fulfilmentService.ts`.
 *
 * Creates a new fulfilment session in the database.
 */
export async function createFulfilmentSession(
  type: FulfilmentSession["type"],
  eventId: EventId,
  fulfilmentEntities: FulfilmentEntity[]
): Promise<FulfilmentSessionId> {
  const fulfilmentSessionId = uuidv4() as FulfilmentSessionId;
  fulfilmentServiceLogger.info(
    `createFulfilmentSession: Creating new fulfilment session with ID: ${fulfilmentSessionId}`
  );

  const newFulfilmentSession: FulfilmentSession = {
    type,
    fulfilmentSessionStartTime: Date.now() as UTCTime,
    eventId,
    fulfilmentEntities,
    currentFulfilmentEntityIndex: 0,
  };

  try {
    fulfilmentServiceLogger.info(
      `createFulfilmentSession: New fulfilment session data: ${JSON.stringify(newFulfilmentSession)}`
    );
    await setDoc(doc(db, fulfilmentSessionsRootPath, fulfilmentSessionId), newFulfilmentSession);
  } catch (error) {
    fulfilmentServiceLogger.error(`Failed to create fulfilment session: ${error}`);
    throw new Error(`Failed to create fulfilment session: ${error}`);
  }

  fulfilmentServiceLogger.info(
    `createFulfilmentSession: New fulfilment session created: ${JSON.stringify(newFulfilmentSession)}`
  );
  return fulfilmentSessionId;
}

/**
 * NOTE: Do NOT use this function directly. Fulfilment sessions should be managed through `fulfilmentService.ts`.
 *
 * Retrieves a fulfilment session by its ID.
 */
export async function getFulfilmentSession(
  fulfilmentSessionId: FulfilmentSessionId
): Promise<FulfilmentSession | null> {
  fulfilmentServiceLogger.info(`getFulfilmentSession: Fetching fulfilment session with ID: ${fulfilmentSessionId}`);

  try {
    const docRef = doc(db, fulfilmentSessionsRootPath, fulfilmentSessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const fulfilmentSessionData = docSnap.data() as FulfilmentSession;
      fulfilmentServiceLogger.info(
        `getFulfilmentSession: Fulfilment session data retrieved: ${JSON.stringify(fulfilmentSessionData)}`
      );
      return fulfilmentSessionData;
    } else {
      fulfilmentServiceLogger.warn(`getFulfilmentSession: No fulfilment session found for ID: ${fulfilmentSessionId}`);
      return null;
    }
  } catch (error) {
    fulfilmentServiceLogger.error(`getFulfilmentSession: Failed to retrieve fulfilment session: ${error}`);
    throw new Error(`getFulfilmentSession: Failed to retrieve fulfilment session: ${error}`);
  }
}

/**
 * NOTE: Do NOT use this function directly. Fulfilment sessions should be managed through `fulfilmentService.ts`.
 *
 * Updates a fulfilment session with the provided data.
 */
export async function updateFulfilmentSession(
  fulfilmentSessionId: FulfilmentSessionId,
  fulfilmentSessionData: Partial<FulfilmentSession>
): Promise<void> {
  fulfilmentServiceLogger.info(`updateFulfilmentSession: Updating fulfilment session with ID: ${fulfilmentSessionId}`);

  try {
    const docRef = doc(db, fulfilmentSessionsRootPath, fulfilmentSessionId);
    await updateDoc(docRef, fulfilmentSessionData);
    fulfilmentServiceLogger.info(
      `updateFulfilmentSession: Fulfilment session updated successfully for ID: ${fulfilmentSessionId}`
    );
  } catch (error) {
    fulfilmentServiceLogger.error(`updateFulfilmentSession: Failed to update fulfilment session: ${error}`);
    throw new Error(`updateFulfilmentSession: Failed to update fulfilment session: ${error}`);
  }
}
