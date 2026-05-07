"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type TeamDetail = {
  id: string;
  name: string;
  subscription: { plan: string; status: string } | null;
  members: Array<{ role: string; user: { email: string; name: string | null } }>;
  posts: Array<{ id: string; title: string; status: string; createdAt: string }>;
};

export default function AdminTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => setId(resolved.id)).catch(() => undefined);
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api.get<TeamDetail>(`/api/admin/teams/${id}`).then((response) => setTeam(response.data)).catch(() => undefined);
  }, [id]);

  async function suspend() {
    if (!id) return;
    await api.post(`/api/admin/teams/${id}/suspend`);
  }

  if (!team) return <div className="p-6 text-sm text-muted-foreground">Loading team...</div>;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{team.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{team.subscription?.plan ?? "free"} · {team.subscription?.status ?? "active"}</p>
        </div>
        <Button variant="destructive" onClick={suspend}>Suspend</Button>
      </div>
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Members</h2>
        <div className="mt-3 space-y-2">
          {team.members.map((member) => (
            <div key={member.user.email} className="flex justify-between text-sm">
              <span>{member.user.name ?? member.user.email}</span>
              <span className="text-muted-foreground">{member.role}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Recent posts</h2>
        <div className="mt-3 space-y-2">
          {team.posts.map((post) => (
            <div key={post.id} className="flex justify-between gap-3 text-sm">
              <span className="truncate">{post.title}</span>
              <span className="text-muted-foreground">{post.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
