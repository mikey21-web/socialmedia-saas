"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VoiceExampleEntry {
  content: string;
  platform?: string;
}

interface VoiceExamplesPasteProps {
  value: VoiceExampleEntry[];
  onChange: (examples: VoiceExampleEntry[]) => void;
}

const PLATFORMS = ["instagram", "linkedin", "twitter", "facebook", "tiktok"];

export function VoiceExamplesPaste({ value, onChange }: VoiceExamplesPasteProps) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<string>("");

  const add = () => {
    if (!content.trim()) return;
    onChange([...value, { content: content.trim(), platform: platform || undefined }]);
    setContent("");
    setPlatform("");
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((ex, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed line-clamp-3">{ex.content}</p>
                  {ex.platform && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                      {ex.platform}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(i)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste a top-performing post here..."
          rows={3}
        />
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={(v) => setPlatform(v ?? "")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" onClick={add} disabled={!content.trim()}>
            <Plus className="size-3.5 mr-1" /> Add Example
          </Button>
        </div>
      </div>
    </div>
  );
}
