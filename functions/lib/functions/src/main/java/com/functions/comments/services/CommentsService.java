package com.functions.comments.services;

import com.functions.FirebaseService;
import com.functions.comments.models.UserComment;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

public class CommentsService {

    private static CollectionReference getUserCommentsCollection(String userId) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection("Comments").document(userId).collection("UserComments");
    }

    public static String createCommentForUser(String userId, UserComment comment) throws ExecutionException, InterruptedException {
        comment.setTimestamp(System.currentTimeMillis());
        String commentId = UUID.randomUUID().toString();
        getUserCommentsCollection(userId).document(commentId).set(comment).get();
        return commentId;
    }

    public static UserComment getCommentById(String userId, String commentId) throws ExecutionException, InterruptedException {
        DocumentSnapshot snapshot = getUserCommentsCollection(userId).document(commentId).get().get();
        if (!snapshot.exists()) {
            return null;
        }
        return snapshot.toObject(UserComment.class);
    }

    public static List<UserComment> getAllCommentsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getUserCommentsCollection(userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<UserComment> comments = new ArrayList<>();

        for (QueryDocumentSnapshot doc : documents) {
            comments.add(doc.toObject(UserComment.class));
        }

        return comments;
    }

    public static void updateComment(String userId, String commentId, String newContent) throws ExecutionException, InterruptedException {
        getUserCommentsCollection(userId).document(commentId).update("comment", newContent).get();
    }

    public static void deleteComment(String userId, String commentId) throws ExecutionException, InterruptedException {
        getUserCommentsCollection(userId).document(commentId).delete().get();
    }
}
