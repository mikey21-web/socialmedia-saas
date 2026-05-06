"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_SIGNATURE_LENGTH = 500;

export default function SignatureSettingsPage() {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSignature() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<{ signature: string | null }>("/teams/signature");
        setSignature(response.data.signature ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load signature");
      } finally {
        setLoading(false);
      }
    }

    void loadSignature();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.patch("/teams/signature", { signature });
      setMessage("Signature updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update signature");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-2xl p-5 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Team Signature</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This text is auto-appended to each newly created post.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signature">Signature</Label>
            <span className="text-xs text-muted-foreground">
              {signature.length}/{MAX_SIGNATURE_LENGTH}
            </span>
          </div>
          <Textarea
            id="signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value.slice(0, MAX_SIGNATURE_LENGTH))}
            placeholder="e.g. Team Postiz | Learn more at example.com"
            className="min-h-36 resize-y"
            disabled={loading || saving}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-500">{message}</p>}

        <Button onClick={handleSave} disabled={loading || saving}>
          {loading || saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {loading ? "Loading..." : "Saving..."}
            </>
          ) : (
            "Save Signature"
          )}
        </Button>
      </Card>
    </div>
  );
}
