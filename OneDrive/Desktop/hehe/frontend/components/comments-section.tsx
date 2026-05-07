"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, MessageSquare, Trash2, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCommentsStore, CommentItem } from "@/store/comments";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
}

export function CommentsSection({ postId, currentUserId }: CommentsSectionProps) {
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const comments = useCommentsStore((s) => s.comments);
  const loading = useCommentsStore((s) => s.loading);
  const fetchComments = useCommentsStore((s) => s.fetchComments);
  const addComment = useCommentsStore((s) => s.addComment);
  const deleteComment = useCommentsStore((s) => s.deleteComment);

  useEffect(() => {
    void fetchComments(postId);
  }, [fetchComments, postId]);

  async function handleSubmit() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      await addComment(postId, newContent);
      setNewContent("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {} finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await addComment(postId, replyContent, parentId);
      setReplyContent("");
      setReplyingTo(null);
    } catch {} finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="size-4" />
        {comments.length} comment{comments.length !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItemComponent
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReply={handleReply}
              onDelete={deleteComment}
              postId={postId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a comment... (use @userId to mention)"
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
        />
        <Button onClick={handleSubmit} disabled={submitting || !newContent.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface CommentItemComponentProps {
  comment: CommentItem;
  currentUserId: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (v: string) => void;
  onReply: (parentId: string) => void;
  onDelete: (postId: string, id: string) => void;
  postId: string;
}

function CommentItemComponent({
  comment,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onReply,
  onDelete,
  postId,
}: CommentItemComponentProps) {
  const isOwn = comment.authorId === currentUserId;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {comment.author.name ?? comment.author.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CornerDownRight className="size-3" /> Reply
            </button>
            {isOwn && (
              <button
                onClick={() => onDelete(postId, comment.id)}
                className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="pl-4 border-l border-border ml-4 space-y-2">
          {comment.replies.map((reply) => {
            const isReplyOwn = reply.authorId === currentUserId;
            return (
              <div key={reply.id} className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {reply.author.name ?? reply.author.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  {isReplyOwn && (
                    <button
                      onClick={() => onDelete(postId, reply.id)}
                      className="text-xs text-destructive hover:text-destructive/80 mt-1 flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {replyingTo === comment.id && (
        <div className="pl-4 border-l border-border ml-4 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onReply(comment.id)} disabled={!replyContent.trim()}>
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}