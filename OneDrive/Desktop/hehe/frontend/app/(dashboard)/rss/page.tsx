"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge, type Platform } from "@/components/platform-badge";

const ALL_PLATFORMS: Platform[] = ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok"];

interface RssSource {
  id: string;
  url: string;
  name: string | null;
  platforms: Platform[];
  autoPublish: boolean;
  isActive: boolean;
  lastFetchAt: string | null;
}

export default function RssPage() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    url: "",
    name: "",
    autoPublish: false,
    platforms: ["linkedin"] as Platform[],
  });

  async function fetchSources() {
    setLoading(true);
    try {
      const response = await api.get<RssSource[]>("/rss");
      setSources(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSources();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">RSS feeds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull from blogs and news feeds, then turn fresh items into social drafts or auto-published posts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rss-url">Feed URL</Label>
              <Input id="rss-url" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com/feed.xml" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rss-name">Name</Label>
              <Input id="rss-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Company blog" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      platforms: current.platforms.includes(platform)
                        ? current.platforms.filter((value) => value !== platform)
                        : [...current.platforms, platform],
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    form.platforms.includes(platform)
                      ? "border-ring bg-accent text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.autoPublish}
              onChange={(event) => setForm((current) => ({ ...current, autoPublish: event.target.checked }))}
            />
            Auto-publish new feed items
          </label>

          <Button
            type="button"
            disabled={submitting || !form.url.trim() || form.platforms.length === 0}
            onClick={async () => {
              setSubmitting(true);
              try {
                await api.post("/rss", {
                  url: form.url.trim(),
                  name: form.name.trim() || undefined,
                  platforms: form.platforms,
                  autoPublish: form.autoPublish,
                });
                setForm({ url: "", name: "", autoPublish: false, platforms: ["linkedin"] });
                await fetchSources();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Add source
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading sources...</div>
          ) : sources.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No RSS sources added yet.</div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{source.name || source.url}</p>
                        <p className="text-sm text-muted-foreground">{source.url}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {source.platforms.map((platform) => (
                          <PlatformBadge key={`${source.id}-${platform}`} platform={platform} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last sync: {source.lastFetchAt ? new Date(source.lastFetchAt).toLocaleString() : "Never"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await api.patch(`/rss/${source.id}/toggle`, { isActive: !source.isActive });
                          await fetchSources();
                        }}
                      >
                        {source.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await api.post(`/rss/${source.id}/sync`);
                          await fetchSources();
                        }}
                      >
                        <RefreshCw className="size-3.5" />
                        Sync Now
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={async () => {
                          if (window.confirm(`Delete ${source.name || source.url}?`)) {
                            await api.delete(`/rss/${source.id}`);
                            await fetchSources();
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
