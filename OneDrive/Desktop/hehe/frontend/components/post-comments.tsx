"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCommentsStore } from "@/store/comments";

export function PostComments({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const comments = useCommentsStore((s) => s.comments);
  const loading = useCommentsStore((s) => s.loading);
  const fetchComments = useCommentsStore((s) => s.fetchComments);
  const addComment = useCommentsStore((s) => s.addComment);
  const deleteComment = useCommentsStore((s) => s.deleteComment);

  useEffect(() => {
    void fetchComments(postId);
  }, [fetchComments, postId]);

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await addComment(postId, trimmed);
    setContent("");
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Comments</h2>
      <form onSubmit={(e) => void submitComment(e)} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write an internal note..."
          className="min-h-24"
        />
        <Button type="submit" size="sm">Add Comment</Button>
      </form>

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
        {!loading && comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-md border border-border p-3">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
              <button
                className="text-destructive"
                type="button"
                onClick={() => void deleteComment(postId, comment.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
