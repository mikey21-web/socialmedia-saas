"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: ValidationError[];
}

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportModal({ open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = open ?? internalOpen;

  function setOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setApiError("Please upload a CSV file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setApiError("File too large. Maximum size is 50MB");
      return;
    }
    setSelectedFile(file);
    setApiError(null);
    setResult(null);
    setDryRunResult(null);
  }

  async function handleDryRun() {
    if (!selectedFile) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      formData.append("dryRun", "true");

      const res = await api.post<ImportResult>("/posts/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDryRunResult(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to validate CSV";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);


      const res = await api.post<ImportResult>("/posts/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      if (res.data.imported > 0) {
        onSuccess?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to import CSV";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setDryRunResult(null);
    setApiError(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Posts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import posts. The file should include title, caption,
            platforms, and scheduledAt columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <a
            href="/templates/posts-import-template.csv"
            download="posts-import-template.csv"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <FileText className="size-4" />
            Download CSV template
          </a>


          {/* Drop Zone */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              handleFileChange(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="size-4 text-primary" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: 50MB
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {result.imported > 0 ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="size-4 text-amber-500" />
                )}
                <span>
                  <strong>{result.imported}</strong> posts imported,{" "}
                  <strong>{result.failed}</strong> failed
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Errors:</p>
                  <div className="space-y-1">
                    {result.errors.slice(0, 10).map((error, idx) => (
                      <p key={idx} className="text-xs text-destructive">
                        Row {error.row}: [{error.field}] {error.message}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dry Run Results */}
          {dryRunResult && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Dry Run Results:</p>
              <p className="text-sm text-muted-foreground">
                {dryRunResult.imported} posts would be imported,{" "}
                {dryRunResult.failed} would fail validation
              </p>
              {dryRunResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2">
                  <div className="space-y-1">
                    {dryRunResult.errors.slice(0, 5).map((error, idx) => (
                      <p key={idx} className="text-xs text-destructive">
                        Row {error.row}: {error.message}
                      </p>
                    ))}
                    {dryRunResult.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {dryRunResult.errors.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {result ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDryRun}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? "Validating..." : "Validate (Dry Run)"}
                </Button>
                <Button onClick={handleImport} disabled={!selectedFile || isLoading}>
                  {isLoading ? "Importing..." : "Import Posts"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
