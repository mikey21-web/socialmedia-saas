"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, AlertCircle, Upload, X, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORM_DOTS, PLATFORM_LABELS, type Platform } from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { usePostsetsStore } from "@/store/postsets";
import { uploadFile, generateImage, generateVideo } from "@/lib/media";
import { api } from "@/lib/api";
import { PictureEditorModal } from "@/components/picture-editor-modal";

const ALL_PLATFORMS: Platform[] = ["twitter", "instagram", "linkedin", "facebook", "youtube"];

const schema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Max 280 characters"),
  scheduledAt: z.string().optional(),
  postDelay: z.string().optional(),
  recurrenceEndAt: z.string().optional(),
  postSetId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type MediaTab = "upload" | "generate" | "video";
type RecurrencePreset = "daily" | "weekly" | "monthly" | "custom";

interface Props {
  trigger?: React.ReactNode;
  defaultDate?: string;
  onSuccess?: () => void;
}

export function PostModal({ trigger, defaultDate, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Platform[]>(["twitter"]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [media, setMedia] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [mediaTab, setMediaTab] = useState<MediaTab>("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiVideoPrompt, setAiVideoPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVideoLoading, setAiVideoLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [teamSignature, setTeamSignature] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>("daily");
  const [customCron, setCustomCron] = useState("");
  const [editUrl, setEditUrl] = useState<string | null>(null);

  const createPost = usePostsStore((s) => s.createPost);
  const sets = usePostsetsStore((s) => s.sets);
  const fetchSets = usePostsetsStore((s) => s.fetchSets);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scheduledAt: defaultDate ?? "" },
  });

  const content = watch("content") ?? "";
  const charCount = content.length;

  useEffect(() => {
    async function loadSettings() {
      try {
        const [signatureRes] = await Promise.all([
          api.get<{ signature: string | null }>("/teams/signature"),
          fetchSets(),
        ]);
        setTeamSignature(signatureRes.data.signature);
      } catch {
        setTeamSignature(null);
      }
    }

    if (open) {
      void loadSettings();
    }
  }, [open, fetchSets]);

  function togglePlatform(p: Platform) {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setMedia((prev) => [...prev, ...files].slice(0, 4));
  }

  async function handleGenerateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const url = await generateImage(aiPrompt.trim());
      setMediaUrls((prev) => [...prev, url].slice(0, 4));
      setAiPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateVideo() {
    if (!aiVideoPrompt.trim()) return;
    setAiVideoLoading(true);
    setAiError(null);
    try {
      const url = await generateVideo(aiVideoPrompt.trim());
      setMediaUrls((prev) => [...prev, url].slice(0, 4));
      setAiVideoPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Video generation failed");
    } finally {
      setAiVideoLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);
    let allUrls = [...mediaUrls];

    if (media.length > 0) {
      setUploadingFiles(true);
      try {
        const uploaded = await Promise.all(media.map(uploadFile));
        allUrls = [...allUrls, ...uploaded];
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "File upload failed");
        setUploadingFiles(false);
        return;
      }
      setUploadingFiles(false);
    }

    try {
      const recurrencePattern = isRecurring
        ? recurrencePreset === "daily"
          ? "0 9 * * *"
          : recurrencePreset === "weekly"
            ? "0 9 * * 1"
            : recurrencePreset === "monthly"
              ? "0 9 1 * *"
              : customCron.trim()
        : undefined;

      await createPost(
        values.content,
        selected,
        values.scheduledAt || undefined,
        allUrls.length > 0 ? allUrls : undefined,
        values.scheduledAt && values.postDelay ? Number(values.postDelay) : undefined,
        isRecurring,
        recurrencePattern,
        values.recurrenceEndAt || undefined,
        values.postSetId || undefined,
      );
      reset();
      setSelected(["twitter"]);
      setMedia([]);
      setMediaUrls([]);
      setIsRecurring(false);
      setCustomCron("");
      setRecurrencePreset("daily");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create post");
    }
  }

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5 h-11 md:h-7 w-full sm:w-auto" onClick={() => setOpen(true)}>
      <Plus className="size-3.5" />
      Schedule Post
    </Button>
  );

  const totalMedia = media.length + mediaUrls.length;
  const isUploading = uploadingFiles || isSubmitting;
  const selectedCountLabel = useMemo(() => `Schedule for ${selected.length} platform${selected.length === 1 ? "" : "s"}`, [selected.length]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <span onClick={() => setOpen(true)} className="contents">{trigger}</span> : defaultTrigger}
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {apiError && (
            <div className="flex gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selected.includes(p)
                      ? "border-ring bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", PLATFORM_DOTS[p])} />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-content">Content</Label>
              <span className={cn("text-xs tabular-nums", charCount > 260 ? "text-destructive" : "text-muted-foreground")}>{charCount}/280</span>
            </div>
            <Textarea id="modal-content" placeholder="What do you want to share?" className="min-h-[100px] resize-none" {...register("content")} />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            {teamSignature?.trim() && <p className="text-xs text-muted-foreground whitespace-pre-wrap border border-border rounded-md p-2 bg-muted/30">Signature preview: {teamSignature}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-set">Add to Set (optional)</Label>
            <select
              id="post-set"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              onChange={(e) => setValue("postSetId", e.target.value || undefined)}
              defaultValue=""
            >
              <option value="">No set</option>
              {sets.map((postSet) => (
                <option key={postSet.id} value={postSet.id}>{postSet.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media {totalMedia > 0 && `(${totalMedia}/4)`}</Label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setMediaTab("upload")} className={cn("px-2.5 py-1 text-xs rounded-md border", mediaTab === "upload" ? "bg-accent border-ring" : "border-border text-muted-foreground")}>Upload</button>
                <button type="button" onClick={() => setMediaTab("generate")} className={cn("px-2.5 py-1 text-xs rounded-md border inline-flex items-center gap-1", mediaTab === "generate" ? "bg-accent border-ring" : "border-border text-muted-foreground")}><Sparkles className="size-3" />AI Image</button>
                <button type="button" onClick={() => setMediaTab("video")} className={cn("px-2.5 py-1 text-xs rounded-md border inline-flex items-center gap-1", mediaTab === "video" ? "bg-accent border-ring" : "border-border text-muted-foreground")}><Video className="size-3" />AI Video</button>
              </div>
            </div>

            {mediaTab === "upload" && (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn("relative rounded-lg border-2 border-dashed p-6 text-center", dragActive ? "border-ring bg-accent/50" : "border-border hover:border-muted-foreground")}
              >
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => {
                  const files = Array.from(e.currentTarget.files || []);
                  setMedia((prev) => [...prev, ...files].slice(0, 4));
                  e.currentTarget.value = "";
                }} className="absolute inset-0 cursor-pointer opacity-0" disabled={totalMedia >= 4} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">{totalMedia >= 4 ? "Max 4 files reached" : "Drag files here or click to browse"}</p>
                </div>
              </div>
            )}

            {mediaTab === "generate" && (
              <div className="space-y-2">
                {aiError && <p className="text-xs text-destructive">{aiError}</p>}
                <div className="flex gap-2">
                  <Input placeholder="Describe the image..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleGenerateAI()} disabled={aiLoading || !aiPrompt.trim() || totalMedia >= 4}>
                    {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            {mediaTab === "video" && (
              <div className="space-y-2">
                {aiError && <p className="text-xs text-destructive">{aiError}</p>}
                <div className="flex gap-2">
                  <Input placeholder="Describe the short video..." value={aiVideoPrompt} onChange={(e) => setAiVideoPrompt(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleGenerateVideo()} disabled={aiVideoLoading || !aiVideoPrompt.trim() || totalMedia >= 4}>
                    {aiVideoLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Video className="size-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            {(media.length > 0 || mediaUrls.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {media.map((file, i) => (
                  <div key={`file-${i}`} className="relative flex items-center gap-2 p-2 rounded-lg bg-muted border border-border text-xs">
                    <span className="truncate flex-1">{file.name}</span>
                    <button type="button" onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0 hover:text-destructive"><X className="size-3.5" /></button>
                  </div>
                ))}
                {mediaUrls.map((url, i) => {
                  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
                  return (
                    <div key={`url-${i}`} className="relative rounded-lg overflow-hidden border border-border">
                      {isVideo ? (
                        <video src={url} controls className="w-full h-24 object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`Generated ${i + 1}`} className="w-full h-24 object-cover" />
                      )}
                      <div className="absolute top-1 right-1 flex gap-1">
                        {!isVideo && (
                          <button type="button" onClick={() => setEditUrl(url)} className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Edit</button>
                        )}
                        <button type="button" onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-full bg-black/60 p-0.5 hover:bg-destructive/80"><X className="size-3 text-white" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-scheduled">Schedule for (optional)</Label>
            <Input id="modal-scheduled" type="datetime-local" {...register("scheduledAt")} />
          </div>

          {watch("scheduledAt") && (
            <div className="space-y-1.5">
              <Label htmlFor="modal-delay" title="Delay before this post publishes">Delay (minutes)</Label>
              <Input id="modal-delay" type="number" min={0} max={10080} placeholder="0" {...register("postDelay")} />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="repeat-toggle">Repeat</Label>
              <input id="repeat-toggle" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 accent-primary" />
            </div>
            {isRecurring && (
              <div className="space-y-2">
                <select value={recurrencePreset} onChange={(e) => setRecurrencePreset(e.target.value as RecurrencePreset)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
                {recurrencePreset === "custom" && <Input placeholder="Cron expression" value={customCron} onChange={(e) => setCustomCron(e.target.value)} />}
                <div className="space-y-1.5">
                  <Label htmlFor="recurrence-end">End date</Label>
                  <Input id="recurrence-end" type="date" {...register("recurrenceEndAt")} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUploading || selected.length === 0}>
              {uploadingFiles ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Uploading...</>
              ) : isSubmitting ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</>
              ) : (
                selectedCountLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {editUrl && (
        <PictureEditorModal
          open={Boolean(editUrl)}
          imageUrl={editUrl}
          onClose={() => setEditUrl(null)}
          onSaved={(url) => {
            setMediaUrls((prev) => prev.map((item) => (item === editUrl ? url : item)));
            setEditUrl(null);
          }}
        />
      )}
    </Dialog>
  );
}
