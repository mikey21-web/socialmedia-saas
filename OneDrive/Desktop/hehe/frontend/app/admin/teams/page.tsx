"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Team = {
  id: string;
  name: string;
  createdAt: string;
  subscription: { plan: string; status: string } | null;
  _count: { members: number; posts: number };
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Team[]>("/api/admin/teams").then((response) => setTeams(response.data)).catch(() => undefined);
  }, []);

  const filtered = useMemo(
    () => teams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase())),
    [teams, search],
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" className="h-11 sm:w-72 md:h-9" />
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-3 border-b border-border p-3 text-xs font-medium text-muted-foreground">
          <span>Name</span><span>Plan</span><span>Members</span><span>Posts</span><span>Created</span>
        </div>
        {filtered.map((team) => (
          <Link key={team.id} href={`/admin/teams/${team.id}`} className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-3 border-b border-border p-3 text-sm last:border-b-0 hover:bg-muted/50">
            <span className="truncate">{team.name}</span>
            <span className="capitalize">{team.subscription?.plan ?? "free"}</span>
            <span>{team._count.members}</span>
            <span>{team._count.posts}</span>
            <span>{new Date(team.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
      </Card>
      <Button variant="outline" onClick={() => location.reload()}>Refresh</Button>
    </div>
  );
}
