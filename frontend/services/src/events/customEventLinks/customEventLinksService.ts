import { CustomEventLink, EMPTY_CUSTOM_EVENT_LINK } from "@/interfaces/CustomLinkTypes";
import { EventId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const customEventLinksServiceLogger = new Logger("customEventLinksServiceLogger");

export async function getAllOrganiserCustomEventLinks(userId: UserId): Promise<CustomEventLink[]> {
  customEventLinksServiceLogger.info(`getAllOrganiserCustomEventLinks, ${userId}`);
  try {
    const customEventLinkDocs = await getDocs(collection(db, "CustomLinks", "Events", userId));
    const customEventLinks = customEventLinkDocs.docs.map((doc) => ({
      ...EMPTY_CUSTOM_EVENT_LINK,
      ...(doc.data() as CustomEventLink),
    }));
    return customEventLinks;
  } catch (error) {
    customEventLinksServiceLogger.error(`getAllOrganiserCustomEventLinks ${error}`);
    throw error;
  }
}

export async function saveCustomEventLink(userId: UserId, customEventLink: CustomEventLink): Promise<void> {
  customEventLinksServiceLogger.info(`saveCustomEventLink, ${customEventLink}`);
  try {
    const customEventLinkDocRef = doc(db, "CustomLinks", "Events", userId, customEventLink.customEventLink);
    await setDoc(customEventLinkDocRef, customEventLink);
  } catch (error) {
    customEventLinksServiceLogger.error(`saveCustomEventLink ${error}`);
    throw error;
  }
}

export async function deleteCustomEventLink(userId: UserId, customEventLink: CustomEventLink): Promise<void> {
  customEventLinksServiceLogger.info(`deleteCustomEventLink, ${customEventLink}`);
  try {
    const customEventLinkDocRef = doc(db, "CustomLinks", "Events", userId, customEventLink.customEventLink);
    await deleteDoc(customEventLinkDocRef);
  } catch (error) {
    customEventLinksServiceLogger.error(`deleteCustomEventLink ${error}`);
    throw error;
  }
}

export async function getCustomEventLink(userId: UserId, customEventLink: string): Promise<CustomEventLink> {
  customEventLinksServiceLogger.info(`getCustomEventLink, ${customEventLink}`);
  try {
    const customEventLinkDocRef = doc(db, "CustomLinks", "Events", userId, customEventLink);
    const customEventLinkDoc = await getDoc(customEventLinkDocRef);
    if (!customEventLinkDoc.exists()) {
      throw new Error("Custom event link not found");
    }
    const data = customEventLinkDoc.data() as CustomEventLink;
    return { ...EMPTY_CUSTOM_EVENT_LINK, ...data };
  } catch (error) {
    customEventLinksServiceLogger.error(`getCustomEventLink ${error}`);
    throw error;
  }
}

export async function getEventIdFromCustomEventLink(userId: UserId, customEventLink: string): Promise<EventId> {
  customEventLinksServiceLogger.info(`getEventIdFromCustomEventLink, ${customEventLink}`);
  try {
    const customEventLinkDoc = await getCustomEventLink(userId, customEventLink);
    if (customEventLinkDoc.referenceId === null) {
      throw new Error("EventId is undefined");
    }
    return customEventLinkDoc.referenceId as EventId;
  } catch (error) {
    customEventLinksServiceLogger.error(`getEventIdFromCustomEventLink ${error}`);
    throw error;
  }
}
