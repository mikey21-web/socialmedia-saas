"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  AlertCircle,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PLATFORM_DOTS,
  PLATFORM_LABELS,
  type Platform,
} from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { uploadFile, generateImage } from "@/lib/media";

const ALL_PLATFORMS: Platform[] = [
  "twitter",
  "instagram",
  "linkedin",
  "facebook",
];

const schema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Max 280 characters"),
  scheduledAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type MediaTab = "upload" | "generate";

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const createPost = usePostsStore((s) => s.createPost);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scheduledAt: defaultDate ?? "" },
  });

  const content = watch("content") ?? "";
  const charCount = content.length;

  function togglePlatform(p: Platform) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setMedia((prev) => [...prev, ...files].slice(0, 4));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files || []);
    setMedia((prev) => [...prev, ...files].slice(0, 4));
    e.currentTarget.value = "";
  }

  function removeLocalFile(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  function removeMediaUrl(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
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
      await createPost(
        values.content,
        selected,
        values.scheduledAt || undefined,
        allUrls.length > 0 ? allUrls : undefined
      );
      reset();
      setSelected(["twitter"]);
      setMedia([]);
      setMediaUrls([]);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create post";
      setApiError(message);
    }
  }

  const defaultTrigger = (
    <Button
      size="sm"
      className="gap-1.5 h-11 md:h-7 w-full sm:w-auto"
      onClick={() => setOpen(true)}
    >
      <Plus className="size-3.5" />
      Schedule Post
    </Button>
  );

  const totalMedia = media.length + mediaUrls.length;
  const isUploading = uploadingFiles || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      ) : (
        defaultTrigger
      )}

      <DialogContent className="sm:max-w-lg">
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

          {/* Platform selector */}
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
                  <span
                    className={cn("size-1.5 rounded-full", PLATFORM_DOTS[p])}
                  />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
            {selected.length === 0 && (
              <p className="text-xs text-destructive">
                Select at least one platform
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-content">Content</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  charCount > 260
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {charCount}/280
              </span>
            </div>
            <Textarea
              id="modal-content"
              placeholder="What do you want to share?"
              className="min-h-[100px] resize-none"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Media section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media {totalMedia > 0 && `(${totalMedia}/4)`}</Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMediaTab("upload")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors",
                    mediaTab === "upload"
                      ? "bg-accent border-ring text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab("generate")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors inline-flex items-center gap-1",
                    mediaTab === "generate"
                      ? "bg-accent border-ring text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <Sparkles className="size-3" />
                  AI Generate
                </button>
              </div>
            </div>

            {mediaTab === "upload" && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                  dragActive
                    ? "border-ring bg-accent/50"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={totalMedia >= 4}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {totalMedia >= 4
                        ? "Max 4 files reached"
                        : "Drag files here or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images and videos up to 10 MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mediaTab === "generate" && (
              <div className="space-y-2">
                {aiError && (
                  <p className="text-xs text-destructive">{aiError}</p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the image you want..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleGenerateAI();
                      }
                    }}
                    disabled={aiLoading || totalMedia >= 4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleGenerateAI()}
                    disabled={aiLoading || !aiPrompt.trim() || totalMedia >= 4}
                    className="shrink-0"
                  >
                    {aiLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Powered by FLUX Schnell via Replicate
                </p>
              </div>
            )}

            {/* Media previews */}
            {(media.length > 0 || mediaUrls.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {media.map((file, i) => (
                  <div
                    key={`file-${i}`}
                    className="relative flex items-center gap-2 p-2 rounded-lg bg-muted border border-border text-xs"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeLocalFile(i)}
                      className="shrink-0 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {mediaUrls.map((url, i) => (
                  <div
                    key={`url-${i}`}
                    className="relative rounded-lg overflow-hidden border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Generated ${i + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeMediaUrl(i)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 hover:bg-destructive/80"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule datetime */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-scheduled">Schedule for (optional)</Label>
            <Input
              id="modal-scheduled"
              type="datetime-local"
              {...register("scheduledAt")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || selected.length === 0}
            >
              {uploadingFiles ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading…
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Schedule"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
