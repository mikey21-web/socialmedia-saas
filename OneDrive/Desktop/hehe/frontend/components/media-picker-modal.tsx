"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaStore } from "@/store/media";
import { cn } from "@/lib/utils";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}

type PickerTab = "library" | "upload";

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = true,
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<PickerTab>("library");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const assets = useMediaStore((state) => state.assets);
  const loading = useMediaStore((state) => state.loading);
  const uploading = useMediaStore((state) => state.uploading);
  const fetchAssets = useMediaStore((state) => state.fetchAssets);
  const uploadAsset = useMediaStore((state) => state.uploadAsset);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setSelectedUrls([]);
        setTab("library");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void fetchAssets({ page: 1, append: false });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, fetchAssets]);

  const hasSelection = selectedUrls.length > 0;
  const title = useMemo(
    () => (multiple ? "Select media assets" : "Select a media asset"),
    [multiple],
  );

  function toggleUrl(url: string) {
    setSelectedUrls((current) => {
      if (!multiple) {
        return current[0] === url ? [] : [url];
      }
      return current.includes(url)
        ? current.filter((item) => item !== url)
        : [...current, url];
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const uploaded = await Promise.all(Array.from(files).map((file) => uploadAsset(file)));
    const urls = uploaded.map((asset) => asset.url);
    setSelectedUrls((current) => (multiple ? [...current, ...urls] : [urls[0]]));
    setTab("library");
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-4xl bg-popover sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as PickerTab)}>
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "upload" ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => void handleUpload(event.target.files)}
              />
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="rounded-full border border-border bg-background p-3">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Upload files to your media library</p>
                  <p className="text-xs text-muted-foreground">
                    Images and videos are stored once and can be reused across posts.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Choose files
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 xl:grid-cols-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading media...
                </div>
              ) : assets.length === 0 ? (
                <div className="col-span-full rounded-xl border border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                  Your library is empty. Upload a file to get started.
                </div>
              ) : (
                assets.map((asset) => {
                  const isVideo = asset.mimeType.startsWith("video/");
                  const checked = selectedUrls.includes(asset.url);

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleUrl(asset.url)}
                      className={cn(
                        "group overflow-hidden rounded-xl border text-left transition",
                        checked
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-ring",
                      )}
                    >
                      <div className="relative aspect-square bg-muted/30">
                        {isVideo ? (
                          <video src={asset.url} className="h-full w-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
                          {checked ? <Check className="size-3.5" /> : <span className="block size-3.5 rounded-full border border-white/60" />}
                        </div>
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.source === "generated" ? "Generated" : "Uploaded"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {selectedUrls.length} selected
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!hasSelection}
                onClick={() => {
                  onSelect(selectedUrls);
                  onClose();
                }}
              >
                Use Selected
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
