import { FIREBASE_FUNCTIONS_CREATE_USER_COMMENT, getFirebaseFunctionByName } from "../firebaseFunctionsService";

export interface CreateUserCommentRequest {
  targetUserId: string;
  comment: {
    comment: string;
    authorId: string;
  };
}


export async function createUserComment(targetUserId: string, commentText: string, authorId: string) {
  const commentFn = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_CREATE_USER_COMMENT);

  const payload: CreateUserCommentRequest = {
    targetUserId,
    comment: {
      comment: commentText,
      authorId
    },
  };

  return commentFn(payload)
    .then((result) => {
      return result.data;
    })
    .catch((error) => {
      console.warn(`Failed to create comment for userId=${targetUserId}. Error:`, error);
      throw new Error("Comment creation failed");
    });
}