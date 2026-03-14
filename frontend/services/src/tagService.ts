import { Tag, TagId } from "@/interfaces/TagTypes";
import { Logger } from "@/observability/logger";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const tagServiceLogger = new Logger("tagServiceLogger");

/** Fetch a single tag so callers fail fast when a referenced tag document is missing. */
export async function getTagById(tagId: TagId): Promise<Tag> {
  try {
    const tagDoc = await getDoc(doc(db, "EventTags", tagId));
    if (!tagDoc.exists()) {
      throw new Error(`Tag not found for id=${tagId}`);
    }
    return { ...(tagDoc.data() as Tag), id: tagDoc.id as TagId };
  } catch (error) {
    tagServiceLogger.error(`Failed to get tag by id=${tagId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** Fetch all tags used for organiser and event filtering in a single Firestore read. */
export async function getAllTags(): Promise<Tag[]> {
  try {
    const tagSnapshot = await getDocs(collection(db, "EventTags"));
    const eventTags: Tag[] = [];
    tagSnapshot.forEach((doc) => {
      const tag = doc.data() as Tag;
      tag.id = doc.id as TagId;
      eventTags.push(tag);
    });
    return eventTags;
  } catch (error) {
    tagServiceLogger.error("Failed to get all tags", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
