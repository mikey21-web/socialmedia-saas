"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { PostComments } from "@/components/post-comments";

interface PostDetail {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);

  useEffect(() => {
    async function loadPost() {
      const response = await api.get<PostDetail>(`/posts/${params.id}`);
      setPost(response.data);
    }

    if (params.id) {
      void loadPost();
    }
  }, [params.id]);

  if (!post) {
    return <div className="p-6 text-sm text-muted-foreground">Loading post...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card className="p-4 space-y-2">
        <h1 className="text-lg font-semibold">Post Detail</h1>
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-muted-foreground">Status: {post.status}</p>
      </Card>
      <Card className="p-4">
        <PostComments postId={post.id} />
      </Card>
    </div>
  );
}
