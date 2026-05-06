"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ImagePlus, Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORM_DOTS, PLATFORM_LABELS, type Platform } from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { usePostsetsStore } from "@/store/postsets";
import { api } from "@/lib/api";
import { MediaPickerModal } from "@/components/media-picker-modal";

const ALL_PLATFORMS: Platform[] = ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok"];

const schema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Max 280 characters"),
  scheduledAt: z.string().optional(),
  postDelay: z.string().optional(),
  recurrenceEndAt: z.string().optional(),
  postSetId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type RecurrencePreset = "daily" | "weekly" | "monthly" | "custom";

interface Props {
  trigger?: React.ReactNode;
  defaultDate?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PostModal({ trigger, defaultDate, onSuccess, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selected, setSelected] = useState<Platform[]>(["twitter"]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [teamSignature, setTeamSignature] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>("daily");
  const [customCron, setCustomCron] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "funny" | "inspirational">("professional");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const createPost = usePostsStore((state) => state.createPost);
  const sets = usePostsetsStore((state) => state.sets);
  const fetchSets = usePostsetsStore((state) => state.fetchSets);

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
  const scheduledAt = watch("scheduledAt");
  const charCount = content.length;
  const open = controlledOpen ?? internalOpen;

  function setOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  useEffect(() => {
    setValue("scheduledAt", defaultDate ?? "");
  }, [defaultDate, setValue]);

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

  function togglePlatform(platform: Platform) {
    setSelected((current) =>
      current.includes(platform)
        ? current.filter((value) => value !== platform)
        : [...current, platform],
    );
  }

  async function generateWithAi() {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    try {
      const res = await api.post<{ content: string; hashtags: string[] }>("/ai/generate-caption", {
        topic: aiTopic,
        platforms: selected,
        tone: aiTone,
      });
      const full = res.data.content + (res.data.hashtags.length > 0 ? "\n\n" + res.data.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "");
      setValue("content", full.slice(0, 280), { shouldValidate: true });
      setAiPanelOpen(false);
    } catch {
      // silently fail — user can still type manually
    } finally {
      setAiGenerating(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);

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
        mediaUrls.length > 0 ? mediaUrls : undefined,
        values.scheduledAt && values.postDelay ? Number(values.postDelay) : undefined,
        isRecurring,
        recurrencePattern,
        values.recurrenceEndAt || undefined,
        values.postSetId || undefined,
      );

      reset({ content: "", scheduledAt: defaultDate ?? "", postDelay: "", recurrenceEndAt: "", postSetId: "" });
      setSelected(["twitter"]);
      setMediaUrls([]);
      setIsRecurring(false);
      setCustomCron("");
      setRecurrencePreset("daily");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create post");
    }
  }

  const defaultTrigger = (
    <Button size="sm" className="h-11 w-full gap-1.5 sm:w-auto md:h-7" onClick={() => setOpen(true)}>
      <Plus className="size-3.5" />
      Schedule Post
    </Button>
  );

  const selectedCountLabel = useMemo(
    () => `Schedule for ${selected.length} platform${selected.length === 1 ? "" : "s"}`,
    [selected.length],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger ? <span onClick={() => setOpen(true)} className="contents">{trigger}</span> : defaultTrigger}
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-1 space-y-5">
            {apiError && (
              <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/15 p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{apiError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      selected.includes(platform)
                        ? "border-ring bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:border-muted-foreground",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", PLATFORM_DOTS[platform])} />
                    {PLATFORM_LABELS[platform]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-content">Content</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiPanelOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Sparkles className="size-3" />
                    AI Generate
                  </button>
                  <span className={cn("text-xs tabular-nums", charCount > 260 ? "text-destructive" : "text-muted-foreground")}>
                    {charCount}/280
                  </span>
                </div>
              </div>

              {aiPanelOpen && (
                <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <Input
                    placeholder="Topic or brief (e.g. 'our new product launch')"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void generateWithAi(); } }}
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="funny">Funny</option>
                      <option value="inspirational">Inspirational</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!aiTopic.trim() || aiGenerating}
                      onClick={() => void generateWithAi()}
                      className="gap-1"
                    >
                      {aiGenerating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                      Generate
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Textarea
                id="modal-content"
                placeholder="What do you want to share?"
                className="min-h-[100px] resize-none"
                {...register("content")}
              />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
              {teamSignature?.trim() && (
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                  Signature preview: {teamSignature}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-set">Add to Set (optional)</Label>
              <select
                id="post-set"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                onChange={(event) => setValue("postSetId", event.target.value || undefined)}
                defaultValue=""
              >
                <option value="">No set</option>
                {sets.map((postSet) => (
                  <option key={postSet.id} value={postSet.id}>{postSet.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Media</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)}>
                  <ImagePlus className="size-3.5" />
                  Add Media
                </Button>
              </div>
              {mediaUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {mediaUrls.map((url, index) => {
                    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
                    return (
                      <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-border">
                        {isVideo ? (
                          <video src={url} controls className="h-24 w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={`Selected media ${index + 1}`} className="h-24 w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Pick assets from your shared library or upload new files.
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-scheduled">Schedule for (optional)</Label>
              <Input id="modal-scheduled" type="datetime-local" {...register("scheduledAt")} />
            </div>

            {scheduledAt && (
              <div className="space-y-1.5">
                <Label htmlFor="modal-delay">Delay (minutes)</Label>
                <Input id="modal-delay" type="number" min={0} max={10080} placeholder="0" {...register("postDelay")} />
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="repeat-toggle">Recycle / Evergreen</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Repeat this post on a recurring schedule.</p>
                </div>
                <input
                  id="repeat-toggle"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(event) => setIsRecurring(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </div>

              {isRecurring && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Schedule preset</Label>
                    <select
                      value={recurrencePreset}
                      onChange={(event) => setRecurrencePreset(event.target.value as RecurrencePreset)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {recurrencePreset === "custom" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="custom-cron">Cron expression</Label>
                      <Input
                        id="custom-cron"
                        placeholder="0 9 * * 1"
                        value={customCron}
                        onChange={(event) => setCustomCron(event.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="recurrence-end">End date</Label>
                    <Input id="recurrence-end" type="date" {...register("recurrenceEndAt")} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || selected.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  selectedCountLabel
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(urls) => setMediaUrls((current) => Array.from(new Set([...current, ...urls])).slice(0, 4))}
        multiple
      />
    </>
  );
}
