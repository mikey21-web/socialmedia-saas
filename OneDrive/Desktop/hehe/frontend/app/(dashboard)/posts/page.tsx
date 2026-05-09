'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { DashboardPost } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PostsPage() {
  const { posts, isLoading, fetchPosts } = useDashboardStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Button>+ New Post</Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: DashboardPost }) {
  const statusColor = {
    draft: 'bg-gray-600',
    scheduled: 'bg-yellow-600',
    published: 'bg-green-600',
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm mb-2">{post.content.substring(0, 150)}...</p>
            <div className="flex gap-2 mb-2">
              {post.platforms.map((p) => (
                <Badge key={p} variant="outline">{p}</Badge>
              ))}
            </div>
            <Badge className={statusColor[post.status]}>{post.status}</Badge>
          </div>
          <div className="text-right">
            {post.metrics && (
              <div className="text-xs text-gray-500">
                <p>{post.metrics.impressions} impressions</p>
                <p>{post.metrics.engagements} engagements</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
