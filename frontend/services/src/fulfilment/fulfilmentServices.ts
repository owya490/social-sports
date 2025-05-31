import { EventId } from "@/interfaces/EventTypes";
import { FulfilmentEntity, FulfilmentSessionId, FulfilmentSessionType } from "@/interfaces/FulfilmentTypes";
import { URL } from "@/interfaces/Types";
import { Logger } from "@/observability/logger";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getEventById } from "../events/eventsService";
import { getFormIdByEventId } from "../forms/formsServices";
import { getStripeCheckoutFromEventId } from "../stripe/stripeService";
import {
  createFulfilmentSession,
  getFulfilmentSession,
  updateFulfilmentSession,
} from "./fulfilmentUtils/fulfilmentUtils";

export const fulfilmentServiceLogger = new Logger("fulfilmentServiceLogger");

/**
 * Main entry point for creating fulfilment sessions.
 * Initializes a fulfilment session based on the provided fulfilment session type.
 */
export async function initFulfilmentSession(
  fulfilmentSessionType: FulfilmentSessionType
): Promise<FulfilmentSessionId> {
  switch (fulfilmentSessionType.type) {
    case "checkout": {
      return initCheckoutFulfilmentSession(
        fulfilmentSessionType.eventId,
        fulfilmentSessionType.numTickets,
        fulfilmentSessionType.fulfilmentEntityTypes
      );
    }
  }
}

/**
 * Initializes a checkout fulfilment session for the given event ID with specified fulfilment entity types.
 *
 * NOTE: Fulfilment entities are initialized in the order they are provided in `fulfilmentEntityTypes`.
 */
async function initCheckoutFulfilmentSession(
  eventId: EventId,
  numTickets: number,
  fulfilmentEntityTypes: FulfilmentEntity["type"][]
): Promise<FulfilmentSessionId> {
  fulfilmentServiceLogger.info(`initFulfilmentSession: Initializing fulfilment session for event ID: ${eventId}`);
  // TODO: look into holding tickets here separate from the stripe checkout session (to be able to have free events)

  try {
    const eventData = await getEventById(eventId);

    const fulfilmentEntities: FulfilmentEntity[] = [];
    for (const type of fulfilmentEntityTypes) {
      switch (type) {
        case "stripe": {
          fulfilmentEntities.push({
            type: "stripe",
            stripeCheckoutLink: (await getStripeCheckoutFromEventId(
              eventId,
              eventData.isPrivate,
              numTickets,
              {}
            )) as URL,
          });
          break;
        }

        case "forms": {
          const formId = await getFormIdByEventId(eventId);
          // TODO: need to handle this more gracefully, e.g. potentially do retries?
          if (!formId) {
            fulfilmentServiceLogger.warn(`initFulfilmentSession: No form found for event ID: ${eventId}`);
            continue; // Skip if no form is associated with the event
          }

          fulfilmentEntities.push({
            type: "forms",
            formId,
            tempFormResponseIds: [],
            submittedFormResponseIds: [],
          });
          break;
        }

        default:
          fulfilmentServiceLogger.warn(`initFulfilmentSession: Unknown fulfilment entity type: ${type}`);
      }
    }

    const fulfilmentSessionId = await createFulfilmentSession("checkout", eventId, fulfilmentEntities);

    fulfilmentServiceLogger.info(
      `initFulfilmentSession: Fulfilment session initialized with ID: ${fulfilmentSessionId} for event ID: ${eventId}`
    );
    return fulfilmentSessionId;
  } catch (error) {
    fulfilmentServiceLogger.error(`initFulfilmentSession: Failed to initialize fulfilment session: ${error}`);
    throw new Error(`initFulfilmentSession: Failed to initialize fulfilment session: ${error}`);
  }
}

/**
 * Executes the next fulfilment entity in the session.
 * Returns a boolean indicating whether there are more fulfilment entities to execute.
 */
export async function execNextFulfilmentEntity(
  fulfilmentSessionId: FulfilmentSessionId,
  router: AppRouterInstance
): Promise<boolean> {
  fulfilmentServiceLogger.info(
    `execNextFulfilmentEntity: Executing next fulfilment entity for session ID: ${fulfilmentSessionId}`
  );
  let moreToExecute = true;

  const fulfilmentSession = await getFulfilmentSession(fulfilmentSessionId);
  if (!fulfilmentSession) {
    fulfilmentServiceLogger.error(
      `execNextFulfilmentEntity: No fulfilment session found for ID: ${fulfilmentSessionId}`
    );
    throw new Error(`execNextFulfilmentEntity: No fulfilment session found for ID: ${fulfilmentSessionId}`);
  }

  const currentIndex = fulfilmentSession.currentFulfilmentEntityIndex;
  if (currentIndex >= fulfilmentSession.fulfilmentEntities.length) {
    fulfilmentServiceLogger.warn(
      `execNextFulfilmentEntity: No more fulfilment entities to execute for session ID: ${fulfilmentSessionId}`
    );
    return false;
  }

  if (currentIndex === fulfilmentSession.fulfilmentEntities.length - 1) {
    fulfilmentServiceLogger.info(
      `execNextFulfilmentEntity: Last fulfilment entity reached for session ID: ${fulfilmentSessionId}`
    );
    moreToExecute = false;
  }

  const currentFulfilmentEntity = fulfilmentSession.fulfilmentEntities[currentIndex];
  switch (currentFulfilmentEntity.type) {
    case "stripe": {
      fulfilmentServiceLogger.info(
        `execNextFulfilmentEntity: Executing Stripe fulfilment entity for session ID: ${fulfilmentSessionId}, entity: ${JSON.stringify(
          currentFulfilmentEntity
        )}`
      );
      router.push(currentFulfilmentEntity.stripeCheckoutLink);
      break;
    }

    case "forms": {
      fulfilmentServiceLogger.info(
        `execNextFulfilmentEntity: Executing Forms fulfilment entity for session ID: ${fulfilmentSessionId}, entity: ${JSON.stringify(
          currentFulfilmentEntity
        )}`
      );
      break;
    }
  }

  await updateFulfilmentSession(fulfilmentSessionId, {
    currentFulfilmentEntityIndex: currentIndex + 1,
  });

  fulfilmentServiceLogger.info(
    `execNextFulfilmentEntity: Next fulfilment entity executed for session ID: ${fulfilmentSessionId}, entity: ${JSON.stringify(
      currentFulfilmentEntity
    )}`
  );
  return moreToExecute;
}
