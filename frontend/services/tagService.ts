import { Tag, TagId } from "@/interfaces/TagTypes";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getTagById(tagId: TagId): Promise<Tag> {
    try {
        const tagDoc = await getDoc(doc(db, "EventTags", tagId));
        return { ...(tagDoc.data() as Tag), id: tagDoc.id };
    } catch (error) {
        console.log(error);
        throw error;
    }
}
