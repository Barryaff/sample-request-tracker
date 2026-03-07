"use client";

import { useState, useRef } from "react";
import { RequestStatus, Image as PrismaImage } from "@/generated/prisma/client";
import {
  requestPresignedUrl,
  confirmUpload,
} from "@/app/actions/upload-actions";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon, XIcon, Loader2Icon } from "lucide-react";

interface ImageUploadProps {
  requestId: string;
  gate: RequestStatus;
  existingImages?: PrismaImage[];
}

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.heic,.webp";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function ImageUpload({
  requestId,
  gate,
  existingImages = [],
}: ImageUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newPending: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        newPending.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: "",
          status: "error",
          error: "File exceeds 5MB limit",
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newPending.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        status: "pending",
      });
    }

    setPendingFiles((prev) => [...prev, ...newPending]);

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removePending(id: string) {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }

  async function uploadFile(pending: PendingFile) {
    setPendingFiles((prev) =>
      prev.map((p) =>
        p.id === pending.id ? { ...p, status: "uploading" as const } : p,
      ),
    );

    try {
      // Step 1: Get presigned URL
      const presignedResult = await requestPresignedUrl(
        requestId,
        pending.file.name,
        pending.file.type,
        pending.file.size,
      );

      if (!presignedResult.success) {
        throw new Error(presignedResult.error);
      }

      const { uploadUrl, key } = presignedResult;

      // Step 2: Upload to S3 directly
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: pending.file,
        headers: {
          "Content-Type": pending.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed");
      }

      // Step 3: Confirm upload with server
      const confirmResult = await confirmUpload(
        requestId,
        key,
        pending.file.name,
        gate,
      );

      if (!confirmResult.success) {
        throw new Error(confirmResult.error);
      }

      // Success — the page will revalidate via the server action
      setPendingFiles((prev) => {
        const item = prev.find((p) => p.id === pending.id);
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        return prev.filter((p) => p.id !== pending.id);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed";
      setPendingFiles((prev) =>
        prev.map((p) =>
          p.id === pending.id
            ? { ...p, status: "error" as const, error: message }
            : p,
        ),
      );
    }
  }

  async function uploadAll() {
    const toUpload = pendingFiles.filter((p) => p.status === "pending");
    await Promise.all(toUpload.map(uploadFile));
  }

  const hasPendingFiles = pendingFiles.some((p) => p.status === "pending");
  const isUploading = pendingFiles.some((p) => p.status === "uploading");

  return (
    <div className="flex flex-col gap-4">
      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Uploaded Images</p>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename}
                  className="size-20 object-cover transition-opacity group-hover:opacity-80"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                  {img.filename}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* File input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${requestId}-${gate}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <ImageIcon className="size-4" />
          Select Images
        </Button>
        {hasPendingFiles && (
          <Button
            size="sm"
            onClick={uploadAll}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="size-4" />
                Upload All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingFiles.map((pending) => (
            <div
              key={pending.id}
              className="relative overflow-hidden rounded-lg border border-border"
            >
              {pending.previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pending.previewUrl}
                  alt={pending.file.name}
                  className="size-20 object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center bg-muted">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
              )}

              {/* Status overlay */}
              {pending.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2Icon className="size-6 animate-spin text-white" />
                </div>
              )}

              {pending.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                  <span className="px-1 text-center text-[10px] font-medium text-white">
                    {pending.error}
                  </span>
                </div>
              )}

              {/* Remove button */}
              {pending.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removePending(pending.id)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white transition-colors hover:bg-black/80"
                >
                  <XIcon className="size-3" />
                </button>
              )}

              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                {pending.file.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
