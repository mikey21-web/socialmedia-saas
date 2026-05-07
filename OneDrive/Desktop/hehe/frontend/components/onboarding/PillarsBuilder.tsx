"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface Pillar {
  name: string;
  description: string;
  weight: number;
}

interface PillarsBuilderProps {
  value: Pillar[];
  onChange: (pillars: Pillar[]) => void;
}

export function PillarsBuilder({ value, onChange }: PillarsBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(20);

  const add = () => {
    if (!name.trim() || !description.trim()) return;
    onChange([...value, { name: name.trim(), description: description.trim(), weight }]);
    setName("");
    setDescription("");
    setWeight(20);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const totalWeight = value.reduce((s, p) => s + p.weight, 0);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.description}</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground shrink-0">{p.weight}%</span>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(i)}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Total weight: {totalWeight}%{totalWeight !== 100 && " (should sum to 100%)"}
          </p>
        </div>
      )}

      <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pillar name, e.g. Style Tips" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
        />
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground shrink-0">Weight %</label>
          <input
            type="range"
            min={5}
            max={80}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs font-medium w-8 text-right">{weight}%</span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!name.trim() || !description.trim()}>
          <Plus className="size-3.5 mr-1" /> Add Pillar
        </Button>
      </div>
    </div>
  );
}
