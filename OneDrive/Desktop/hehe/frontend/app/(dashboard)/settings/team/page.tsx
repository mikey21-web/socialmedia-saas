"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MailPlus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTeamsStore } from "@/store/team";

const DEFAULT_TEAM_ID = process.env.NEXT_PUBLIC_TEAM_ID ?? "team-1";

export default function TeamSettingsPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const team = useTeamsStore((s) => s.team);
  const loading = useTeamsStore((s) => s.loading);
  const error = useTeamsStore((s) => s.error);
  const fetchTeam = useTeamsStore((s) => s.fetchTeam);
  const addMember = useTeamsStore((s) => s.addMember);
  const removeMember = useTeamsStore((s) => s.removeMember);

  useEffect(() => {
    fetchTeam(DEFAULT_TEAM_ID);
  }, [fetchTeam]);

  const teamId = team?.id ?? DEFAULT_TEAM_ID;
  const members = team?.members ?? [];
  const isAdmin = useMemo(() => members.some((member) => member.role === "admin"), [members]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await addMember(teamId, email.trim());
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(userId: string) {
    await removeMember(teamId, userId);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite teammates and manage member access.
        </p>
      </div>

      <Card className="p-4 space-y-2">
        <p className="text-sm text-muted-foreground">Team ID</p>
        <code className="inline-flex rounded-md bg-muted px-2 py-1 text-xs text-foreground">
          {teamId}
        </code>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Team Name</p>
          <p className="text-base font-medium">{team?.name ?? "Your Team"}</p>
        </div>
        <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 md:h-9"
            required
          />
          <Button type="submit" disabled={submitting || loading} className="h-11 md:h-9 w-full sm:w-auto gap-2">
            <MailPlus className="size-4" />
            Invite member
          </Button>
        </form>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Members</h2>
        {members.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No team members</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Invite your first teammate to start collaborating.
            </p>
            <Button
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[type="email"]');
                input?.focus();
              }}
              className="mt-4 h-11 md:h-9"
            >
              Invite teammate
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <Card key={member.userId} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">
                    {member.role}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!isAdmin || member.role === "admin"}
                  onClick={() => handleRemove(member.userId)}
                  className="h-11 md:h-7"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
