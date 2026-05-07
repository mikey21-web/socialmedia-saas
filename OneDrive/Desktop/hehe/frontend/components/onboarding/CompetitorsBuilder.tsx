"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CompetitorEntry {
  name: string;
  handles: Record<string, string>;
}

interface CompetitorsBuilderProps {
  value: CompetitorEntry[];
  onChange: (competitors: CompetitorEntry[]) => void;
}

export function CompetitorsBuilder({ value, onChange }: CompetitorsBuilderProps) {
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const add = () => {
    if (!name.trim()) return;
    const handles: Record<string, string> = {};
    if (instagram.trim()) handles.instagram = instagram.trim();
    if (twitter.trim()) handles.twitter = twitter.trim();
    if (linkedin.trim()) handles.linkedin = linkedin.trim();
    onChange([...value, { name: name.trim(), handles }]);
    setName("");
    setInstagram("");
    setTwitter("");
    setLinkedin("");
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Object.entries(c.handles)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" | ") || "No handles"}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(i)}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competitor name" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@instagram" />
          <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@twitter" />
          <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn URL" />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!name.trim()}>
          <Plus className="size-3.5 mr-1" /> Add Competitor
        </Button>
      </div>
    </div>
  );
}
