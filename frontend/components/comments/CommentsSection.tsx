"use client";
import { useState, useEffect } from "react";
import { useUser } from "../utility/UserContext";
import { createUserComment, getAllCommentsForUser } from "@/services/src/comments/commentsService";

interface Comment {
  id?: string;
  text: string;
  authorId: string;
  timestamp: any;
}

export default function CommentsSection({ userId }: { userId: string }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useUser();


  const fetchComments = () => {
    getAllCommentsForUser(userId)
      .then((data) => {
        console.log("Fetched comments:", data);
        setComments(
          data.map((c: any) => ({
            id: c.id,
            text: c.comment,
            authorId: c.authorId,
            timestamp: c.timestamp,
          }))
        );
      })
      .catch(console.error);
  }

  useEffect(() => {
    console.log("Fetching comments for userId:", userId);
    fetchComments();
  }, [userId]);

  const handleSubmit = async () => {
    if (!comment.trim() || !currentUser || loading) return;

    setLoading(true);
    try {
      await createUserComment(userId, comment, currentUser.user.userId);
      setComment("");

      // Refetch comments after posting, or optionally append the new comment locally
      await fetchComments();

    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !comment.trim()}
            className={`mt-2 px-4 py-2 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } flex items-center justify-center`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : null}
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-4">
          You must be logged in to leave a comment.
        </p>
      )}

      {comments.length === 0 && <p className="text-gray-500">No comments yet.</p>}

      {comments.map((c) => (
        <div key={c.id} className="mb-6 p-4 border rounded-md shadow-sm bg-white">
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-semibold">User:</span> {c.authorId || "Anonymous"}
          </p>
          <p className="text-gray-800 text-base mb-2 whitespace-pre-wrap">{c.text}</p>
          <p className="text-xs text-gray-400">
            {new Date(c.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
