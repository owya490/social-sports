"use client";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/services/src/firebase";

interface Comment {
  id?: string;
  text: string;
  authorId: string;
  timestamp: any;
}

export default function CommentsSection({ userId }: { userId: string }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const commentsRef = collection(db, "Comments", userId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: Comment[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(fetched);
    });

    return () => unsub();
  }, [userId]);

  const handleSubmit = () => {
    if (!comment.trim() || !currentUser) return;

  };

  return (
    <div className="mt-12 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {currentUser ? (
        <div className="mb-4">
          <textarea
            className="w-full border p-2 rounded"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <button
            onClick={handleSubmit}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Post Comment
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-4">
          You must be logged in to leave a comment.
        </p>
      )}

      {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}

      {comments.map((c) => (
        <div key={c.id} className="mb-4 border-b pb-2">
          <p className="text-sm text-gray-600">User: {c.authorId}</p>
          <p>{c.text}</p>
        </div>
      ))}
    </div>
  );
}
