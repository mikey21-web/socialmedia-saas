"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Textbox, filters } from "fabric";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/media";

interface Props {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onSaved: (url: string) => void;
}

export function PictureEditorModal({ open, imageUrl, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 900,
      height: 520,
      backgroundColor: "#0f172a",
    });
    fabricRef.current = canvas;

    void (async () => {
      const img = await FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" });
      img.scaleToWidth(860);
      img.set({ left: 20, top: 20 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    })();

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [open, imageUrl]);

  async function saveEdited() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `edited-${Date.now()}.png`, { type: "image/png" });
      const url = await uploadFile(file);
      onSaved(url);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new Textbox("Edit me", {
      left: 60,
      top: 60,
      fill: "#ffffff",
      fontSize: 32,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  function addSticker() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const sticker = new Textbox("⭐", {
      left: 120,
      top: 120,
      fontSize: 56,
    });
    canvas.add(sticker);
    canvas.setActiveObject(sticker);
    canvas.renderAll();
  }

  function applyFilter(type: "brightness" | "contrast" | "grayscale") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!(activeObject instanceof FabricImage)) return;

    const currentFilters = activeObject.filters ?? [];
    if (type === "brightness") {
      currentFilters.push(new filters.Brightness({ brightness: 0.12 }));
    }
    if (type === "contrast") {
      currentFilters.push(new filters.Contrast({ contrast: 0.2 }));
    }
    if (type === "grayscale") {
      currentFilters.push(new filters.Grayscale());
    }

    activeObject.filters = currentFilters;
    activeObject.applyFilters();
    canvas.renderAll();
  }

  function cropCenter() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!(activeObject instanceof FabricImage)) return;

    const width = activeObject.width ?? 0;
    const height = activeObject.height ?? 0;
    activeObject.set({
      cropX: width * 0.1,
      cropY: height * 0.1,
      width: width * 0.8,
      height: height * 0.8,
    });
    canvas.renderAll();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 p-4">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={addText} size="sm">Add Text</Button>
          <Button type="button" onClick={addSticker} size="sm" variant="outline">Add Sticker</Button>
          <Button type="button" onClick={cropCenter} size="sm" variant="outline">Crop</Button>
          <Button type="button" onClick={() => applyFilter("brightness")} size="sm" variant="outline">Brightness</Button>
          <Button type="button" onClick={() => applyFilter("contrast")} size="sm" variant="outline">Contrast</Button>
          <Button type="button" onClick={() => applyFilter("grayscale")} size="sm" variant="outline">Grayscale</Button>
          <Button type="button" onClick={onClose} size="sm" variant="outline">Close</Button>
          <Button type="button" onClick={() => void saveEdited()} size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="flex-1 rounded-md border border-border bg-slate-900 p-3">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
      </div>
    </div>
  );
}
