import { collection, getDocs } from "firebase/firestore";
import { FIREBASE_FUNCTIONS_CREATE_USER_COMMENT, getFirebaseFunctionByName } from "../firebaseFunctionsService";
import { db } from "../firebase";

export interface CreateUserCommentRequest {
    targetUserId: string;
    comment: {
        comment: string;
        authorId: string;
    };
}

export async function createUserComment(
    targetUserId: string,
    commentText: string,
    authorId: string
) {
    const payload: CreateUserCommentRequest = {
        targetUserId,
        comment: {
            comment: commentText,
            authorId,
        },
    };

    const res = await fetch(
        "https://australia-southeast1-socialsports-44162.cloudfunctions.net/createUserComment",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );

    if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Failed to create comment. Status=${res.status}, Body=${errorText}`);
        throw new Error("Comment creation failed");
    }

    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
        const data = await res.json();
        return data;
    } else {
        const text = await res.text();
        console.warn("Expected JSON, got text:", text);
        return { message: text };
    }
}


export async function getAllCommentsForUser(userId: string) {
    if (!userId) {
        throw new Error("User ID is required");
    }

    try {
        const commentsCollection = collection(db, "Comments", userId, "UserComments");
        const querySnapshot = await getDocs(commentsCollection);

        const comments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return comments;
    } catch (error) {
        console.error(`Error getting comments for user ${userId}:`, error);
        throw error;
    }
}
