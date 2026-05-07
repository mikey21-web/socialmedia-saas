"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChipInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChipInput({ value, onChange, placeholder = "Type and press Enter", className }: ChipInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const trimmed = input.trim();
      if (!value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[44px]", className)}>
      {value.map((chip, i) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          {chip}
          <button type="button" onClick={() => remove(i)} className="hover:text-destructive">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="border-0 shadow-none p-0 h-7 min-w-[120px] flex-1 focus-visible:ring-0"
      />
    </div>
  );
}
