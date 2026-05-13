"use client";

import { useEffect, useState } from "react";
import { Film, Loader2, Plus, Upload, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface VideoProject {
  id: string;
  title: string;
  sourceVideoUrl: string;
  status: string;
  suggestedHooks: string[];
  outputFormats: Array<{ platform: string; aspectRatio: string }>;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-blue-500/15 text-blue-400",
  processing: "bg-amber-500/15 text-amber-400",
  clips_ready: "bg-green-500/15 text-green-400",
  published: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

const PLATFORM_FORMATS = [
  { platform: "Instagram Reels", ratio: "9:16", icon: "📱" },
  { platform: "TikTok", ratio: "9:16", icon: "🎵" },
  { platform: "YouTube Shorts", ratio: "9:16", icon: "▶️" },
  { platform: "LinkedIn", ratio: "16:9", icon: "💼" },
  { platform: "X / Twitter", ratio: "1:1", icon: "🐦" },
];

export default function VideoPage() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/api/media/video-projects")
      .then(r => setProjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createProject() {
    if (!title.trim() || !videoUrl.trim()) return;
    setUploading(true);
    try {
      const res = await api.post("/api/media/video-projects", {
        title,
        sourceVideoUrl: videoUrl,
      });
      setProjects(prev => [res.data, ...prev]);
      setTitle("");
      setVideoUrl("");
      setShowUpload(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Film className="size-6 text-purple-500" />
            Video Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a video clip → auto-format for every platform with captions and hooks.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="size-4" /> New Video
        </Button>
      </div>

      {/* Platform format cards */}
      <div className="grid grid-cols-5 gap-3">
        {PLATFORM_FORMATS.map(f => (
          <Card key={f.platform} className="text-center p-3">
            <p className="text-lg">{f.icon}</p>
            <p className="text-xs font-medium mt-1">{f.platform}</p>
            <p className="text-[10px] text-muted-foreground">{f.ratio}</p>
          </Card>
        ))}
      </div>

      {/* Upload form */}
      {showUpload && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Video Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product demo clip" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Video URL (S3/R2 link)</Label>
                <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createProject} disabled={uploading || !title.trim() || !videoUrl.trim()}>
                {uploading ? <Loader2 className="size-4 animate-spin mr-1" /> : <Upload className="size-4 mr-1" />}
                Process Video
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center">
          <Film className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No video projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a 30-60 second clip and we&apos;ll format it for every platform.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <Card key={project.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{project.title}</p>
                    <Badge className={STATUS_COLORS[project.status] ?? "bg-muted"}>
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {project.suggestedHooks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Wand2 className="size-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {project.suggestedHooks.length} hook suggestions ready
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {project.outputFormats.map((f: any, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-muted">
                      {f.platform?.split("_")[0]}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
