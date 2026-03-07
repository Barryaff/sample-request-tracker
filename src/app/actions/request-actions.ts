"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { transitionState } from "@/lib/workflow";
import { generateDisplayId } from "@/lib/display-id";
import {
  FlavorCategory,
  Priority,
  RequestStatus,
  SampleType,
} from "@/generated/prisma/client";

const createRequestSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  productName: z.string().min(1, "Product name is required"),
  flavorCategory: z.nativeEnum(FlavorCategory),
  sampleType: z.nativeEnum(SampleType),
  quantity: z.string().min(1, "Quantity is required"),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .refine((val) => new Date(val) > new Date(), "Deadline must be in the future"),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  specialInstructions: z.string().optional(),
});

export async function createRequest(
  formData: FormData,
): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    const raw = {
      customerName: formData.get("customerName"),
      productName: formData.get("productName"),
      flavorCategory: formData.get("flavorCategory"),
      sampleType: formData.get("sampleType"),
      quantity: formData.get("quantity"),
      deadline: formData.get("deadline"),
      priority: formData.get("priority") || Priority.NORMAL,
      specialInstructions: formData.get("specialInstructions") || undefined,
    };

    const parsed = createRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const data = parsed.data;
    const displayId = await generateDisplayId();

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.sampleRequest.create({
        data: {
          displayId,
          customerName: data.customerName,
          productName: data.productName,
          flavorCategory: data.flavorCategory,
          sampleType: data.sampleType,
          quantity: data.quantity,
          deadline: new Date(data.deadline),
          priority: data.priority,
          specialInstructions: data.specialInstructions ?? null,
          status: RequestStatus.REQUESTED,
          currentAssigneeRole: "APPROVER",
          requesterId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          requestId: created.id,
          userId: user.id,
          previousStatus: null,
          newStatus: RequestStatus.REQUESTED,
          notes: "Request created",
        },
      });

      return created;
    });

    revalidatePath("/my-actions");
    revalidatePath("/dashboard");

    return { success: true, requestId: request.id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("createRequest error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create request",
    };
  }
}

const transitionSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  toStatus: z.nativeEnum(RequestStatus),
  notes: z.string().optional(),
});

export async function transitionRequestStatus(
  requestId: string,
  toStatus: RequestStatus,
  notes?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    const parsed = transitionSchema.safeParse({ requestId, toStatus, notes });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    await transitionState(parsed.data.requestId, parsed.data.toStatus, user.id, parsed.data.notes);

    revalidatePath(`/requests/${parsed.data.requestId}`);
    revalidatePath("/dashboard");
    revalidatePath("/my-actions");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("transitionRequestStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

const updateRequestSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").optional(),
  productName: z.string().min(1, "Product name is required").optional(),
  flavorCategory: z.nativeEnum(FlavorCategory).optional(),
  sampleType: z.nativeEnum(SampleType).optional(),
  quantity: z.string().min(1, "Quantity is required").optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
    .refine((val) => new Date(val) > new Date(), "Deadline must be in the future")
    .optional(),
  priority: z.nativeEnum(Priority).optional(),
  specialInstructions: z.string().optional(),
});

export async function updateRequest(
  requestId: string,
  data: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    const request = await prisma.sampleRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.requesterId !== user.id) {
      return { success: false, error: "Only the requester can edit this request" };
    }

    if (
      request.status !== RequestStatus.REQUESTED &&
      request.status !== RequestStatus.REVISION_REQUESTED
    ) {
      return {
        success: false,
        error: "Request can only be edited when in REQUESTED or REVISION_REQUESTED status",
      };
    }

    const raw: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      if (value !== "" && value !== null) {
        raw[key] = value;
      }
    }

    const parsed = updateRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const updates = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (updates.customerName !== undefined) updateData.customerName = updates.customerName;
    if (updates.productName !== undefined) updateData.productName = updates.productName;
    if (updates.flavorCategory !== undefined) updateData.flavorCategory = updates.flavorCategory;
    if (updates.sampleType !== undefined) updateData.sampleType = updates.sampleType;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.deadline !== undefined) updateData.deadline = new Date(updates.deadline);
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.specialInstructions !== undefined)
      updateData.specialInstructions = updates.specialInstructions || null;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    await prisma.sampleRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/dashboard");
    revalidatePath("/my-actions");

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("updateRequest error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update request",
    };
  }
}
