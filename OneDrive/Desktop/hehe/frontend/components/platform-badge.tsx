import { cn } from "@/lib/utils";

export type Platform = "twitter" | "instagram" | "linkedin" | "facebook";

export const PLATFORM_STYLES: Record<Platform, string> = {
  twitter:   "bg-sky-500/15 text-sky-400 border-sky-500/30",
  instagram: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  linkedin:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  facebook:  "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

export const PLATFORM_DOTS: Record<Platform, string> = {
  twitter:   "bg-sky-400",
  instagram: "bg-pink-400",
  linkedin:  "bg-blue-400",
  facebook:  "bg-indigo-400",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter:   "X / Twitter",
  instagram: "Instagram",
  linkedin:  "LinkedIn",
  facebook:  "Facebook",
};

interface Props {
  platform: Platform;
  className?: string;
  showLabel?: boolean;
}

export function PlatformBadge({ platform, className, showLabel = true }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        PLATFORM_STYLES[platform],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", PLATFORM_DOTS[platform])} />
      {showLabel && PLATFORM_LABELS[platform]}
    </span>
  );
}
