"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PLATFORM_DOTS, type Platform } from "@/components/platform-badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const ALL_PLATFORMS: Platform[] = ["twitter", "instagram", "linkedin", "facebook", "youtube", "tiktok"];

const schema = z.object({
  caption: z.string().min(1, "Caption is required").max(5000, "Max 5000 characters"),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (result: { ab_test_id: string; variantA_postId: string; variantB_postId: string }) => void;
}

export function AbTestModal({ open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selected, setSelected] = useState<Platform[]>(["twitter"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");

  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  const isOpen = open ?? internalOpen;


  function setOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }


  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });


  const caption = watch("caption") ?? "";

  function handleTimeChange(type: "A" | "B", value: string) {
    if (type === "A") {
      setTimeA(value);
    } else {
      setTimeB(value);
    }
    setTimeWarning(null);

    // Check time difference
    if (timeA && timeB) {
      const dateA = new Date(timeA);
      const dateB = new Date(timeB);
      if (!Number.isNaN(dateA.getTime()) && !Number.isNaN(dateB.getTime())) {
        const diff = Math.abs(dateA.getTime() - dateB.getTime());
        const hourInMs = 60 * 60 * 1000;
        if (diff < hourInMs) {
          setTimeWarning("Time difference should be at least 1 hour for meaningful results");
        }
        if (dateA.getTime() === dateB.getTime()) {
          setTimeWarning("Time A and Time B must be different");
        }
      }
    }
  }

  function togglePlatform(platform: Platform) {
    setSelected((current) =>
      current.includes(platform)
        ? current.filter((value) => value !== platform)
        : [...current, platform],
    );
  }

  async function onSubmit(values: FormValues) {
    if (selected.length === 0) {
      setApiError("Select at least one platform");
      return;
    }
    if (!timeA || !timeB) {
      setApiError("Both Time A and Time B are required");
      return;
    }
    setIsSubmitting(true);
    setApiError(null);


    try {
      const res = await api.post<{
        ab_test_id: string;
        variantA_postId: string;
        variantB_postId: string;
      }>("/posts/ab-test", {
        caption: values.caption,
        platforms: selected,
        timeA,
        timeB,
      });
      setOpen(false);
      reset();
      setTimeA("");
      setTimeB("");
      onSuccess?.(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create A/B test";
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-5" />
            A/B Test Publish Times
          </DialogTitle>
          <DialogDescription>
            Create two identical posts with different publish times to discover
            the optimal posting time for your audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected.includes(platform)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50",
                  )}
                >
<span
                    className={cn("size-2 rounded-full", PLATFORM_DOTS[platform] ?? "bg-gray-400")}
                  />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <Label htmlFor="ab-caption">Caption</Label>
            <Textarea
              id="ab-caption"
              rows={4}
              placeholder="Write your post content..."
              {...register("caption")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.caption?.message}</span>
              <span>{caption.length}/5000</span>
            </div>
          </div>


          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="time-a">Time A</Label>
              <Input
                id="time-a"
                type="datetime-local"
                value={timeA}
                onChange={(e) => handleTimeChange("A", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time-b">Time B</Label>
              <Input
                id="time-b"
                type="datetime-local"
                value={timeB}
                onChange={(e) => handleTimeChange("B", e.target.value)}
              />
            </div>
          </div>

          {/* Time Warning */}
          {timeWarning && (
            <p className="text-xs text-amber-500">{timeWarning}</p>
          )}


          {/* API Error */}
          {apiError && (
            <p className="text-sm text-destructive">{apiError}</p>
          )}


          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                selected.length === 0 ||
                !timeA ||
                !timeB ||
                !caption
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create A/B Test"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
