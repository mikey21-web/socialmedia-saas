"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  async function load() {
    const response = await api.get<{ users: User[] }>("/api/admin/users");
    setUsers(response.data.users);
  }

  useEffect(() => {
    void load();
  }, []);

  async function suspend(id: string) {
    await api.post(`/api/admin/users/${id}/suspend`);
    await load();
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Users</h1>
      <Card className="divide-y divide-border">
        {users.map((user) => (
          <div key={user.id} className="grid gap-3 p-3 text-sm sm:grid-cols-[1fr_100px_100px_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <span className="capitalize">{user.role}</span>
            <span>{user.suspended ? "Suspended" : "Active"}</span>
            <Button variant="destructive" disabled={user.suspended} onClick={() => suspend(user.id)}>
              Suspend
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
