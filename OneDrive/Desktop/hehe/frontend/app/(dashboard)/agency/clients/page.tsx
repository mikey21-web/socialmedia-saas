"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, Plus, Upload, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface ClientPortal {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientTeamId: string;
  brandColor: string;
  previewLink: string;
  lastAccessedAt?: string;
  createdAt: string;
}

export default function AgencyClientsPage() {
  const [clients, setClients] = useState<ClientPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newClient, setNewClient] = useState({ clientName: "", clientEmail: "" });
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get("/api/agency/clients");
      setClients(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function addClient() {
    if (!newClient.clientName.trim()) return;
    setAdding(true);
    try {
      await api.post("/api/agency/clients", newClient);
      setNewClient({ clientName: "", clientEmail: "" });
      setShowAdd(false);
      fetchClients();
    } finally {
      setAdding(false);
    }
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Client Portals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            White-label dashboards for your clients. They approve posts without logging in.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBulk(true)}>
            <Upload className="size-4 mr-1" /> Bulk Import
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="size-4 mr-1" /> Add Client
          </Button>
        </div>
      </div>

      {/* Add Client Form */}
      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Client Name</Label>
                <Input
                  value={newClient.clientName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (optional)</Label>
                <Input
                  value={newClient.clientEmail}
                  onChange={(e) => setNewClient(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addClient} disabled={adding || !newClient.clientName.trim()}>
                {adding ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                Create Portal
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No clients yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first client to generate their white-label portal link.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{client.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.clientEmail ?? "No email"} · Created {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                  {client.lastAccessedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last viewed: {new Date(client.lastAccessedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyLink(client.previewLink, client.id)}
                    className="gap-1"
                  >
                    <Copy className="size-3" />
                    {copied === client.id ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(client.previewLink, "_blank")}
                  >
                    <ExternalLink className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
