"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { validateUpload, getPresignedUploadUrl, getPublicUrl } from "@/lib/s3";
import { RequestStatus } from "@/generated/prisma/client";

const presignedUrlSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  fileSize: z.number().positive("File size must be positive"),
});

export async function requestPresignedUrl(
  requestId: string,
  filename: string,
  contentType: string,
  fileSize: number,
): Promise<{ success: true; uploadUrl: string; key: string } | { success: false; error: string }> {
  try {
    await getCurrentUser();

    const parsed = presignedUrlSchema.safeParse({ requestId, filename, contentType, fileSize });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    validateUpload(parsed.data.contentType, parsed.data.fileSize, parsed.data.filename);

    const request = await prisma.sampleRequest.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const uniquePrefix = crypto.randomUUID();
    const key = `requests/${parsed.data.requestId}/${uniquePrefix}/${parsed.data.filename}`;

    const uploadUrl = await getPresignedUploadUrl(key, parsed.data.contentType);

    return { success: true, uploadUrl, key };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("requestPresignedUrl error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate upload URL",
    };
  }
}

const confirmUploadSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  key: z.string().min(1, "Upload key is required"),
  filename: z.string().min(1, "Filename is required"),
  gate: z.nativeEnum(RequestStatus),
});

export async function confirmUpload(
  requestId: string,
  key: string,
  filename: string,
  gate: RequestStatus,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    const parsed = confirmUploadSchema.safeParse({ requestId, key, filename, gate });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const request = await prisma.sampleRequest.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const url = getPublicUrl(parsed.data.key);

    await prisma.image.create({
      data: {
        requestId: parsed.data.requestId,
        gate: parsed.data.gate,
        url,
        filename: parsed.data.filename,
        uploadedBy: user.id,
      },
    });

    revalidatePath(`/requests/${parsed.data.requestId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("confirmUpload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm upload",
    };
  }
}
