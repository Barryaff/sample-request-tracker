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
  FlavorDesignation,
  PhysicalForm,
  Priority,
  QcOutcome,
  QuantityUnit,
  RequestStatus,
  SampleType,
  ShipTemp,
  ShippingCarrier,
} from "@/generated/prisma/client";

// ── Create Request ──────────────────────────────────────────────────────────

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
  // New flavor house fields (all optional)
  flavorDesignation: z.nativeEnum(FlavorDesignation).optional(),
  physicalForm: z.nativeEnum(PhysicalForm).optional(),
  quantityValue: z.coerce.number().positive().optional(),
  quantityUnit: z.nativeEnum(QuantityUnit).optional(),
  targetProfile: z.string().optional(),
  referenceProduct: z.string().optional(),
  regulatoryRequirements: z.string().optional(),
  allergenInfo: z.string().optional(),
  shelfLife: z.string().optional(),
  storageConditions: z.string().optional(),
});

export async function createRequest(
  formData: FormData,
): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    const raw: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (value !== "" && value !== null) {
        raw[key] = value;
      }
    }

    // Apply defaults
    if (!raw.priority) raw.priority = Priority.NORMAL;

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
          flavorDesignation: data.flavorDesignation ?? null,
          physicalForm: data.physicalForm ?? null,
          quantityValue: data.quantityValue ?? null,
          quantityUnit: data.quantityUnit ?? null,
          targetProfile: data.targetProfile ?? null,
          referenceProduct: data.referenceProduct ?? null,
          regulatoryRequirements: data.regulatoryRequirements ?? null,
          allergenInfo: data.allergenInfo ?? null,
          shelfLife: data.shelfLife ?? null,
          storageConditions: data.storageConditions ?? null,
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

// ── Transition Status ───────────────────────────────────────────────────────

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

// ── Update Request ──────────────────────────────────────────────────────────

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
  flavorDesignation: z.nativeEnum(FlavorDesignation).optional(),
  physicalForm: z.nativeEnum(PhysicalForm).optional(),
  quantityValue: z.coerce.number().positive().optional(),
  quantityUnit: z.nativeEnum(QuantityUnit).optional(),
  targetProfile: z.string().optional(),
  referenceProduct: z.string().optional(),
  regulatoryRequirements: z.string().optional(),
  allergenInfo: z.string().optional(),
  shelfLife: z.string().optional(),
  storageConditions: z.string().optional(),
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

    if (request.requesterId !== user.id && user.role !== "ADMIN") {
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
    const fields = [
      "customerName", "productName", "flavorCategory", "sampleType",
      "quantity", "priority", "specialInstructions", "flavorDesignation",
      "physicalForm", "quantityValue", "quantityUnit", "targetProfile",
      "referenceProduct", "regulatoryRequirements", "allergenInfo",
      "shelfLife", "storageConditions",
    ] as const;

    for (const field of fields) {
      if ((updates as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (updates as Record<string, unknown>)[field];
      }
    }

    if (updates.deadline !== undefined) {
      updateData.deadline = new Date(updates.deadline);
    }

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

// ── QC Result ───────────────────────────────────────────────────────────────

const qcResultSchema = z.object({
  requestId: z.string().min(1),
  outcome: z.nativeEnum(QcOutcome),
  appearance: z.boolean().default(true),
  aroma: z.boolean().default(true),
  taste: z.boolean().default(true),
  color: z.boolean().default(true),
  specificGravity: z.coerce.number().positive().optional(),
  refractiveIndex: z.coerce.number().positive().optional(),
  pH: z.coerce.number().min(0).max(14).optional(),
  viscosity: z.coerce.number().positive().optional(),
  moistureContent: z.coerce.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

export async function submitQcResult(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    if (user.role !== "QC_OFFICER" && user.role !== "ADMIN") {
      return { success: false, error: "Only QC Officers can submit QC results" };
    }

    const raw: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (value === "" || value === null) continue;
      if (["appearance", "aroma", "taste", "color"].includes(key)) {
        raw[key] = value === "true";
      } else {
        raw[key] = value;
      }
    }

    const parsed = qcResultSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const data = parsed.data;

    const request = await prisma.sampleRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.status !== "QC_CHECK") {
      return { success: false, error: "Request must be in QC_CHECK status" };
    }

    // Upsert QC result (allow re-testing)
    await prisma.qcResult.upsert({
      where: { requestId: data.requestId },
      create: {
        requestId: data.requestId,
        outcome: data.outcome,
        appearance: data.appearance,
        aroma: data.aroma,
        taste: data.taste,
        color: data.color,
        specificGravity: data.specificGravity ?? null,
        refractiveIndex: data.refractiveIndex ?? null,
        pH: data.pH ?? null,
        viscosity: data.viscosity ?? null,
        moistureContent: data.moistureContent ?? null,
        remarks: data.remarks ?? null,
        testedById: user.id,
      },
      update: {
        outcome: data.outcome,
        appearance: data.appearance,
        aroma: data.aroma,
        taste: data.taste,
        color: data.color,
        specificGravity: data.specificGravity ?? null,
        refractiveIndex: data.refractiveIndex ?? null,
        pH: data.pH ?? null,
        viscosity: data.viscosity ?? null,
        moistureContent: data.moistureContent ?? null,
        remarks: data.remarks ?? null,
        testedById: user.id,
      },
    });

    revalidatePath(`/requests/${data.requestId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("submitQcResult error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit QC result",
    };
  }
}

// ── Shipment ────────────────────────────────────────────────────────────────

const shipmentSchema = z.object({
  requestId: z.string().min(1),
  carrier: z.nativeEnum(ShippingCarrier).optional(),
  trackingNumber: z.string().optional(),
  shippingAddress: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  temperature: z.nativeEnum(ShipTemp).default(ShipTemp.AMBIENT),
  notes: z.string().optional(),
});

export async function saveShipment(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();

    if (user.role !== "SHIPPER" && user.role !== "PACKER" && user.role !== "ADMIN") {
      return { success: false, error: "Only Packers, Shippers, or Admins can manage shipments" };
    }

    const raw: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (value !== "" && value !== null) {
        raw[key] = value;
      }
    }

    const parsed = shipmentSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const data = parsed.data;

    const request = await prisma.sampleRequest.findUnique({
      where: { id: data.requestId },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    await prisma.shipment.upsert({
      where: { requestId: data.requestId },
      create: {
        requestId: data.requestId,
        carrier: data.carrier ?? null,
        trackingNumber: data.trackingNumber ?? null,
        shippingAddress: data.shippingAddress ?? null,
        recipientName: data.recipientName ?? null,
        recipientPhone: data.recipientPhone ?? null,
        temperature: data.temperature,
        notes: data.notes ?? null,
      },
      update: {
        carrier: data.carrier ?? null,
        trackingNumber: data.trackingNumber ?? null,
        shippingAddress: data.shippingAddress ?? null,
        recipientName: data.recipientName ?? null,
        recipientPhone: data.recipientPhone ?? null,
        temperature: data.temperature,
        notes: data.notes ?? null,
      },
    });

    revalidatePath(`/requests/${data.requestId}`);

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("saveShipment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save shipment",
    };
  }
}

// ── Customer management ─────────────────────────────────────────────────────

const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export async function createCustomer(
  formData: FormData,
): Promise<{ success: true; customerId: string } | { success: false; error: string }> {
  try {
    await getCurrentUser();

    const raw: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (value !== "" && value !== null) {
        raw[key] = value;
      }
    }

    const parsed = createCustomerSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Validation failed" };
    }

    const data = parsed.data;

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        company: data.company ?? null,
        contactPerson: data.contactPerson ?? null,
        email: data.email || null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        country: data.country ?? null,
        notes: data.notes ?? null,
      },
    });

    return { success: true, customerId: customer.id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("createCustomer error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customer",
    };
  }
}

export async function searchCustomers(
  query: string,
): Promise<{ id: string; name: string; company: string | null }[]> {
  if (!query || query.length < 2) return [];

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, company: true },
    take: 10,
    orderBy: { name: "asc" },
  });

  return customers;
}
