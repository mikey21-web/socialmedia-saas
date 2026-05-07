"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

function isAdminToken(token: string | null) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminToken(token)) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router, token]);

  if (!ready) return null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/admin" className="text-sm font-semibold">Admin</Link>
        <nav className="flex gap-3 text-sm text-muted-foreground">
          <Link href="/admin/teams">Teams</Link>
          <Link href="/admin/users">Users</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
