"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaStore } from "@/store/media";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}

type PickerTab = "library" | "upload" | "avatar" | "animated";

const HYPERFRAME_TEMPLATES = [
  {
    id: "quote-card",
    label: "Quote Card",
    emoji: "💬",
    description: "Animated inspirational or testimonial quote",
    fields: [
      { key: "quote", label: "Quote", type: "textarea" as const, maxLength: 200, required: true },
      { key: "author", label: "Author / Source", type: "text" as const, maxLength: 60, required: true },
      { key: "accentColor", label: "Accent Color", type: "color" as const, required: false, placeholder: "#6366f1" },
    ],
  },
  {
    id: "announcement",
    label: "Announcement",
    emoji: "📣",
    description: "Product launch, event, or news announcement",
    fields: [
      { key: "headline", label: "Headline", type: "text" as const, maxLength: 80, required: true },
      { key: "subtext", label: "Subtext (optional)", type: "text" as const, maxLength: 120, required: false },
      { key: "badge", label: "Badge (e.g. NEW, LIVE)", type: "text" as const, maxLength: 12, required: false },
      { key: "accentColor", label: "Accent Color", type: "color" as const, required: false, placeholder: "#6366f1" },
    ],
  },
  {
    id: "stat-card",
    label: "Stat Card",
    emoji: "📊",
    description: "Showcase a key metric or milestone",
    fields: [
      { key: "metric", label: "Number / Metric", type: "text" as const, maxLength: 20, required: true, placeholder: "10,000+" },
      { key: "label", label: "Label", type: "text" as const, maxLength: 40, required: true, placeholder: "Happy Customers" },
      { key: "context", label: "Context (optional)", type: "text" as const, maxLength: 60, required: false, placeholder: "in just 6 months" },
      { key: "accentColor", label: "Accent Color", type: "color" as const, required: false, placeholder: "#6366f1" },
    ],
  },
  {
    id: "product-showcase",
    label: "Product Showcase",
    emoji: "✦",
    description: "Brand or product highlight video",
    fields: [
      { key: "productName", label: "Product Name", type: "text" as const, maxLength: 40, required: true },
      { key: "tagline", label: "Tagline", type: "text" as const, maxLength: 80, required: true },
      { key: "cta", label: "CTA Button (optional)", type: "text" as const, maxLength: 30, required: false, placeholder: "Try Free →" },
      { key: "accentColor", label: "Accent Color", type: "color" as const, required: false, placeholder: "#6366f1" },
    ],
  },
] as const;

type HyperFrameTemplateId = (typeof HYPERFRAME_TEMPLATES)[number]["id"];

interface HyperFrameField {
  key: string;
  label: string;
  type: "text" | "textarea" | "color";
  maxLength?: number;
  required: boolean;
  placeholder?: string;
}

interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url: string;
}

interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = true,
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<PickerTab>("library");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const assets = useMediaStore((state) => state.assets);
  const loading = useMediaStore((state) => state.loading);
  const uploading = useMediaStore((state) => state.uploading);
  const fetchAssets = useMediaStore((state) => state.fetchAssets);
  const uploadAsset = useMediaStore((state) => state.uploadAsset);

  // HeyGen state
  const [heygenAvatars, setHeygenAvatars] = useState<HeyGenAvatar[]>([]);
  const [heygenVoices, setHeygenVoices] = useState<HeyGenVoice[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [avatarType, setAvatarType] = useState<"avatar" | "talking_photo">("avatar");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"landscape" | "story">("story");
  const [captions, setCaptions] = useState(true);
  const [heygenLoading, setHeygenLoading] = useState(false);
  const [heygenGenerating, setHeygenGenerating] = useState(false);
  const [heygenError, setHeygenError] = useState<string | null>(null);
  const [heygenElapsed, setHeygenElapsed] = useState(0);

  // HyperFrames state
  const [hfTemplate, setHfTemplate] = useState<string>("quote-card");
  const [hfFormat, setHfFormat] = useState<"story" | "square" | "landscape">("story");
  const [hfData, setHfData] = useState<Record<string, string>>({ accentColor: "#6366f1" });
  const [hfRendering, setHfRendering] = useState(false);
  const [hfError, setHfError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setSelectedUrls([]);
        setTab("library");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void fetchAssets({ page: 1, append: false });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, fetchAssets]);

  // Load HeyGen avatars and voices when tab switches to avatar
  useEffect(() => {
    if (tab !== "avatar") return;
    setHeygenLoading(true);
    setHeygenError(null);
    Promise.all([
      api.get("/media/heygen/avatars"),
      api.get("/media/heygen/voices"),
    ])
      .then(([avatarsRes, voicesRes]) => {
        setHeygenAvatars(avatarsRes.data);
        setHeygenVoices(voicesRes.data);
      })
      .catch((err: unknown) => {
        const status =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 400 || status === 403 || status === 404) {
          setHeygenError("HeyGen not connected. Go to Settings > Connections to add your API key.");
        } else {
          setHeygenError("Failed to load HeyGen avatars. Check your API key or try again.");
        }
      })
      .finally(() => setHeygenLoading(false));
  }, [tab]);

  // Elapsed timer during HeyGen generation
  useEffect(() => {
    if (!heygenGenerating) {
      setHeygenElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setHeygenElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [heygenGenerating]);

  const hasSelection = selectedUrls.length > 0;
  const title = useMemo(
    () => (multiple ? "Select media assets" : "Select a media asset"),
    [multiple],
  );

  function toggleUrl(url: string) {
    setSelectedUrls((current) => {
      if (!multiple) {
        return current[0] === url ? [] : [url];
      }
      return current.includes(url)
        ? current.filter((item) => item !== url)
        : [...current, url];
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const uploaded = await Promise.all(Array.from(files).map((file) => uploadAsset(file)));
    const urls = uploaded.map((asset) => asset.url);
    setSelectedUrls((current) => (multiple ? [...current, ...urls] : [urls[0]]));
    setTab("library");
  }

  const heygenReady =
    !!script.trim() &&
    !!selectedAvatar &&
    !!selectedVoice &&
    script.length <= 2000;

  async function handleHeygenGenerate() {
    if (!heygenReady) return;
    setHeygenGenerating(true);
    setHeygenError(null);
    try {
      // Start async job — returns immediately with jobId
      const startRes = await api.post<{ jobId: string }>("/media/heygen/start", {
        script: script.trim(),
        avatarId: selectedAvatar,
        voiceId: selectedVoice,
        type: avatarType,
        aspectRatio,
        captions,
      });
      const { jobId } = startRes.data;

      // Poll every 5s until completed or failed
      let attempts = 0;
      const MAX_ATTEMPTS = 60; // 5 minutes max
      while (attempts < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
        const statusRes = await api.get<{ status: string; url?: string }>(
          `/media/heygen/status/${jobId}`,
        );
        const { status, url } = statusRes.data;
        if (status === "completed") {
          if (!url) throw new Error("Generation completed but no URL returned");
          onSelect([url]);
          onClose();
          return;
        }
        if (status === "failed") {
          throw new Error("HeyGen video generation failed. Check your avatar and voice settings.");
        }
        // status = pending | processing — keep polling
      }
      throw new Error("Generation timed out after 5 minutes. Try a shorter script.");
    } catch (err: unknown) {
      const axiosMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const message =
        axiosMsg ??
        (err instanceof Error ? err.message : null) ??
        "Failed to generate avatar video";
      setHeygenError(message);
    } finally {
      setHeygenGenerating(false);
    }
  }

  const hfTemplateDef = useMemo(
    () => HYPERFRAME_TEMPLATES.find((t) => t.id === hfTemplate),
    [hfTemplate],
  );

  const hfReady = useMemo(() => {
    if (!hfTemplateDef) return false;
    return hfTemplateDef.fields
      .filter((f) => f.required)
      .every((f) => (hfData[f.key]?.trim() ?? "").length > 0);
  }, [hfTemplateDef, hfData]);

  async function handleHyperframeRender() {
    if (!hfReady || !hfTemplateDef) return;
    setHfRendering(true);
    setHfError(null);
    try {
      const res = await api.post<{ url?: string }>("/media/hyperframes/render", {
        templateId: hfTemplate,
        data: hfData,
        format: hfFormat,
      });
      if (!res.data?.url) throw new Error("Render completed but no URL returned");
      onSelect([res.data.url]);
      onClose();
    } catch (err: unknown) {
      const axiosMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const message =
        axiosMsg ??
        (err instanceof Error ? err.message : null) ??
        "Failed to render. Make sure FFmpeg is installed on the server.";
      setHfError(message);
    } finally {
      setHfRendering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-4xl bg-popover sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as PickerTab)}>
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
              <TabsTrigger value="avatar">🎬 AI Avatar</TabsTrigger>
              <TabsTrigger value="animated">✨ Animated Card</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "upload" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => void handleUpload(event.target.files)}
              />
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="rounded-full border border-border bg-background p-3">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Upload files to your media library</p>
                  <p className="text-xs text-muted-foreground">
                    Images and videos are stored once and can be reused across posts.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Choose files
                </Button>
              </div>
            </div>
          ) : tab === "avatar" ? (
            <div className="space-y-4">
              {heygenGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p className="mt-4 text-center text-lg font-medium">
                    Generating avatar video… this takes 1–3 minutes.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Do not close this window.
                  </p>
                  <p className="mt-2 text-lg font-semibold text-primary">
                    Elapsed: {heygenElapsed}s
                  </p>
                </div>
              ) : heygenError && !heygenLoading ? (
                <div className="rounded-xl border border-amber-500 bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">⚠️ HeyGen not connected</p>
                      <p className="text-sm">{heygenError}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/settings/connections"}
                      >
                        Open Settings →
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {heygenLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin" />
                      <span className="ml-2">Loading avatars…</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="script">Script</Label>
                        <Textarea
                          id="script"
                          placeholder="Write what the avatar will say…"
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          maxLength={2000}
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          {script.length}/2000 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {heygenAvatars.map((avatar) => (
                            <button
                              key={avatar.avatar_id}
                              type="button"
                              onClick={() => setSelectedAvatar(avatar.avatar_id)}
                              className={cn(
                                "relative overflow-hidden rounded-lg border-2 p-1 transition",
                                selectedAvatar === avatar.avatar_id
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "border-border hover:border-ring",
                              )}
                            >
                              <div className="aspect-square overflow-hidden rounded-md bg-muted">
                                <img
                                  src={avatar.preview_image_url}
                                  alt={avatar.avatar_name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <p className="mt-1 truncate text-xs">{avatar.avatar_name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="voice">Voice</Label>
                        <Select
                          value={selectedVoice}
                          onValueChange={(value) => setSelectedVoice(value ?? "")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {heygenVoices.map((voice) => (
                              <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                {voice.name} ({voice.language}) - {voice.gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-2">
                          <Label>Format</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={aspectRatio === "landscape" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio("landscape")}
                            >
                              16:9 Landscape
                            </Button>
                            <Button
                              type="button"
                              variant={aspectRatio === "story" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio("story")}
                            >
                              9:16 Story/Reels
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={captions ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCaptions(!captions)}
                          >
                            {captions ? "✓ " : ""}Captions
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleHeygenGenerate}
                        disabled={!heygenReady}
                        className="w-full"
                      >
                        Generate Avatar Video
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Takes 1–3 minutes
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : tab === "animated" ? (
            <div className="space-y-4">
              {hfRendering ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p className="mt-4 text-center text-lg font-medium">
                    Rendering animated card… ~15 seconds
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Do not close this window.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Pick Template</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {HYPERFRAME_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setHfTemplate(template.id);
                            setHfData({ accentColor: "#6366f1" });
                          }}
                          className={cn(
                            "rounded-lg border-2 p-3 text-left transition",
                            hfTemplate === template.id
                              ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                              : "border-border hover:border-ring",
                          )}
                        >
                          <span className="text-2xl">{template.emoji}</span>
                          <p className="mt-1 font-medium">{template.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {hfTemplateDef && (
                    <div className="space-y-3 rounded-lg border border-border p-4">
                      <Label>Fill Details</Label>
                      {hfTemplateDef.fields.map((field) => {
                        const f = field as HyperFrameField;
                        return (
                          <div key={f.key} className="space-y-1">
                            <Label htmlFor={f.key} className="text-sm">
                              {f.label}
                            </Label>
                            {f.type === "textarea" ? (
                              <Textarea
                                id={f.key}
                                value={hfData[f.key] ?? ""}
                                onChange={(e) =>
                                  setHfData((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                maxLength={f.maxLength}
                                placeholder={f.placeholder}
                              />
                            ) : f.type === "color" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={hfData[f.key] ?? "#6366f1"}
                                  onChange={(e) =>
                                    setHfData((prev) => ({ ...prev, [f.key]: e.target.value }))
                                  }
                                  className="h-10 w-16 shrink-0"
                                />
                                <Input
                                  type="text"
                                  value={hfData[f.key] ?? "#6366f1"}
                                  onChange={(e) =>
                                    setHfData((prev) => ({ ...prev, [f.key]: e.target.value }))
                                  }
                                  placeholder="#6366f1"
                                  className="flex-1"
                                />
                              </div>
                            ) : (
                              <Input
                                id={f.key}
                                type="text"
                                value={hfData[f.key] ?? ""}
                                onChange={(e) =>
                                  setHfData((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                maxLength={f.maxLength}
                                placeholder={f.placeholder}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Format</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={hfFormat === "story" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHfFormat("story")}
                      >
                        9:16 Story
                      </Button>
                      <Button
                        type="button"
                        variant={hfFormat === "square" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHfFormat("square")}
                      >
                        1:1 Square
                      </Button>
                      <Button
                        type="button"
                        variant={hfFormat === "landscape" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHfFormat("landscape")}
                      >
                        16:9 Wide
                      </Button>
                    </div>
                  </div>

                  {hfError && (
                    <div className="rounded-lg border border-red-500 bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
                      <p className="text-sm">{hfError}</p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleHyperframeRender}
                    disabled={!hfReady}
                    className="w-full"
                  >
                    Render Animated Card
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Renders in ~15 seconds
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 xl:grid-cols-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading media...
                </div>
              ) : assets.length === 0 ? (
                <div className="col-span-full rounded-xl border border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                  Your library is empty. Upload a file to get started.
                </div>
              ) : (
                assets.map((asset) => {
                  const isVideo = asset.mimeType.startsWith("video/");
                  const checked = selectedUrls.includes(asset.url);

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleUrl(asset.url)}
                      className={cn(
                        "group overflow-hidden rounded-xl border text-left transition",
                        checked
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-ring",
                      )}
                    >
                      <div className="relative aspect-square bg-muted/30">
                        {isVideo ? (
                          <video src={asset.url} className="h-full w-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                          {checked ? <Check className="size-3.5" /> : <span className="block size-3.5 rounded-full border border-white/60" />}
                        </div>
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.source === "generated" ? "Generated" : "Uploaded"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {tab !== "avatar" && tab !== "animated" && (
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {selectedUrls.length} selected
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => {
                    onSelect(selectedUrls);
                    onClose();
                  }}
                >
                  Use Selected
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}