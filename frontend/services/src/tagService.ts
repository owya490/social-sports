import { Tag, TagId } from "@/interfaces/TagTypes";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getTagById(tagId: TagId): Promise<Tag> {
  try {
    const tagDoc = await getDoc(doc(db, "EventTags", tagId));
    return { ...(tagDoc.data() as Tag), id: tagDoc.id as TagId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

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
    console.error(error);
    throw error;
  }
}
