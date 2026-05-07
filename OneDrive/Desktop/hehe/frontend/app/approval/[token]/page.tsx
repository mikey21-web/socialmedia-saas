"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PlatformBadge, Platform } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  platforms: Platform[];
  createdAt: string;
}

interface ApprovalResponse {
  status: "pending" | "already_used" | "expired";
  action?: "approved" | "rejected";
  post: Post | null;
}

interface ActionResponse {
  success: boolean;
  postId: string;
  action: "approved" | "rejected";
}

type ViewState = "loading" | "pending" | "already_used" | "expired" | "success";

export default function ApprovalPage() {
  const params = useParams();
  const token = params.token as string;

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [post, setPost] = useState<Post | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApproval = async () => {
    try {
      setError(null);
      const { data } = await api.get<ApprovalResponse>(`/api/approval/${token}`);

      if (data.status === "pending") {
        setPost(data.post);
        setViewState("pending");
      } else if (data.status === "already_used") {
        setAction(data.action || null);
        setViewState("already_used");
      } else if (data.status === "expired") {
        setViewState("expired");
      }
    } catch {
      setError("Failed to load approval details");
      setViewState("pending");
    }
  };

  useEffect(() => {
    fetchApproval();
  }, [token]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post<ActionResponse>(
        `/api/approval/${token}/approve`
      );
      if (data.success) {
        setAction("approved");
        setViewState("success");
      }
    } catch {
      setError("Failed to approve post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post<ActionResponse>(
        `/api/approval/${token}/reject`,
        { reason: rejectionReason }
      );
      if (data.success) {
        setAction("rejected");
        setViewState("success");
      }
    } catch {
      setError("Failed to reject post");
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = viewState === "pending";
  const showPostPreview = isPending && post;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Diyaa AI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Social Media Management Platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {viewState === "loading" && "Loading..."}
              {viewState === "pending" && "Review Post"}
              {viewState === "already_used" && "Already Processed"}
              {viewState === "expired" && "Link Expired"}
              {viewState === "success" && "Action Completed"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {viewState === "loading" && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && viewState === "pending" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <AlertCircle className="size-12 text-destructive" />
                <p className="text-destructive text-center">{error}</p>
                <Button variant="outline" onClick={fetchApproval}>
                  <ArrowLeft className="size-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {showPostPreview && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {post.platforms.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} />
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {post.title}
                  </h3>
                </div>

                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {post.content}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Rejection reason (optional)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="size-4" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4 mr-2" />
                    )}
                    Approve
                  </Button>

                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {viewState === "already_used" && (
              <div className="flex flex-col items-center gap-4 py-6">
                {action === "approved" ? (
                  <CheckCircle className="size-16 text-emerald-500" />
                ) : (
                  <XCircle className="size-16 text-destructive" />
                )}

                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">
                    This link has already been used
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Action taken:{" "}
                    <span
                      className={cn(
                        "font-medium",
                        action === "approved"
                          ? "text-emerald-500"
                          : "text-destructive"
                      )}
                    >
                      {action}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {viewState === "expired" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Clock className="size-16 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">
                    Link Expired
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This approval link has expired. Please contact the sender to
                    request a new one.
                  </p>
                </div>
              </div>
            )}

            {viewState === "success" && (
              <div className="flex flex-col items-center gap-4 py-6">
                {action === "approved" ? (
                  <CheckCircle className="size-16 text-emerald-500" />
                ) : (
                  <XCircle className="size-16 text-destructive" />
                )}

                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">
                    Post {action === "approved" ? "Approved" : "Rejected"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action === "approved"
                      ? "The post has been approved and will be scheduled."
                      : "The post has been rejected."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Diyaa AI
        </p>
      </div>
    </div>
  );
}