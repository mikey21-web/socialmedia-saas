"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaStore, type MediaSourceFilter } from "@/store/media";

type FilterMode = "all" | "images" | "videos" | "generated" | "upload";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

export default function MediaLibraryPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const assets = useMediaStore((state) => state.assets);
  const total = useMediaStore((state) => state.total);
  const hasMore = useMediaStore((state) => state.hasMore);
  const loading = useMediaStore((state) => state.loading);
  const uploading = useMediaStore((state) => state.uploading);
  const source = useMediaStore((state) => state.source);
  const tag = useMediaStore((state) => state.tag);
  const error = useMediaStore((state) => state.error);
  const fetchAssets = useMediaStore((state) => state.fetchAssets);
  const loadMore = useMediaStore((state) => state.loadMore);
  const deleteAsset = useMediaStore((state) => state.deleteAsset);
  const setTag = useMediaStore((state) => state.setTag);
  const uploadAsset = useMediaStore((state) => state.uploadAsset);
  const generateAsset = useMediaStore((state) => state.generateAsset);

  useEffect(() => {
    const sourceFilter: MediaSourceFilter =
      filterMode === "generated" ? "generated" : filterMode === "upload" ? "upload" : source;
    const timer = window.setTimeout(() => {
      void fetchAssets({
        source: sourceFilter,
        tag,
        page: 1,
        append: false,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAssets, filterMode, source, tag]);

  const visibleAssets = useMemo(() => {
    if (filterMode === "images") {
      return assets.filter((asset) => asset.mimeType.startsWith("image/"));
    }
    if (filterMode === "videos") {
      return assets.filter((asset) => asset.mimeType.startsWith("video/"));
    }
    return assets;
  }, [assets, filterMode]);

  const tags = useMemo(
    () => Array.from(new Set(assets.flatMap((asset) => asset.tags))).sort((a, b) => a.localeCompare(b)),
    [assets],
  );

  async function handleUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    await Promise.all(Array.from(files).map((file) => uploadAsset(file)));
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      return;
    }
    await generateAsset(prompt.trim());
    setPrompt("");
    setGenerateOpen(false);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reuse uploaded and AI-generated assets across your publishing workflow.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload New
          </Button>
          <Button type="button" onClick={() => setGenerateOpen(true)} disabled={uploading}>
            <Sparkles className="size-4" />
            Generate with AI
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{total} assets</CardTitle>
              <CardDescription>Filter by kind, source, or tags.</CardDescription>
            </div>
            <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
              <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="generated">Generated</TabsTrigger>
                <TabsTrigger value="upload">Uploaded</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="xs"
                variant={tag === null ? "default" : "outline"}
                onClick={() => setTag(null)}
              >
                All tags
              </Button>
              {tags.map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  size="xs"
                  variant={tag === chip ? "default" : "outline"}
                  onClick={() => setTag(tag === chip ? null : chip)}
                >
                  {chip}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading && assets.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading media...
            </div>
          ) : visibleAssets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-background">
                <ImagePlus className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No assets match this filter</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload files or generate fresh creative to build your library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {visibleAssets.map((asset) => {
                const isVideo = asset.mimeType.startsWith("video/");

                return (
                  <div key={asset.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="aspect-square bg-muted/30">
                      {isVideo ? (
                        <video src={asset.url} controls className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="space-y-1">
                        <p className="truncate text-sm font-medium">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{asset.source}</Badge>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`Delete ${asset.filename}?`)) {
                              void deleteAsset(asset.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map((assetTag) => (
                            <Badge key={assetTag} variant="secondary">
                              {assetTag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate image with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want to create"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleGenerate()} disabled={uploading || !prompt.trim()}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
