"use client";

import { useEffect, useState } from "react";
import { LinkIcon, Loader2, Plug, RefreshCw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

type Credential = {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  expiresAt: string | null;
  status: "connected" | "expired" | "failed";
};

const platforms = [
  { key: "twitter", label: "Twitter/X", icon: X },
  { key: "linkedin", label: "LinkedIn", icon: LinkIcon },
];

export default function ConnectionsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get<Credential[]>("/api/platforms/credentials");
      setCredentials(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  async function disconnect(id: string) {
    await api.delete(`/api/platforms/credentials/${id}`);
    await load();
  }

  function connect(platform: string) {
    window.location.assign(`${api.defaults.baseURL}/api/platforms/connect/${platform}`);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect publishing accounts for this workspace.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {platforms.map(({ key, label, icon: Icon }) => {
          const credential = credentials.find((item) => item.platform === key || (key === "twitter" && item.platform === "x"));
          return (
            <Card key={key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{label}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {credential?.accountName ?? credential?.accountId ?? "Not connected"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {credential?.status ?? "Disconnected"}
                </Badge>
              </div>
              {credential?.expiresAt && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Expires {new Date(credential.expiresAt).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                {credential ? (
                  <>
                    {credential.status !== "connected" && (
                      <Button variant="outline" onClick={() => connect(key)} className="h-11 gap-2 md:h-9">
                        <RefreshCw className="size-4" />
                        Reconnect
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => disconnect(credential.id)} className="h-11 gap-2 md:h-9">
                      <Trash2 className="size-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => connect(key)} className="h-11 gap-2 md:h-9">
                    <Plug className="size-4" />
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading connections...
        </div>
      )}
    </div>
  );
}
