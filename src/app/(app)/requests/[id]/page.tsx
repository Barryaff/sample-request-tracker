import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { ActionButtons } from "@/components/action-buttons";
import { AuditTimeline } from "@/components/audit-timeline";
import { ImageUpload } from "@/components/image-upload";
import {
  FLAVOR_CATEGORY_LABELS,
  FLAVOR_DESIGNATION_LABELS,
  PHYSICAL_FORM_LABELS,
  QUANTITY_UNIT_LABELS,
  SAMPLE_TYPE_LABELS,
  QC_OUTCOME_LABELS,
  SHIPPING_CARRIER_LABELS,
  SHIP_TEMP_LABELS,
} from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, isPast } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FlaskConical,
  ImageIcon,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function DetailItem({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
        {label}
      </dt>
      <dd className={cn("mt-1.5 text-sm text-foreground", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const request = await prisma.sampleRequest.findUnique({
    where: { id },
    include: {
      requester: true,
      customer: true,
      auditLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      images: true,
      qcResult: {
        include: { testedBy: true },
      },
      shipment: true,
    },
  });

  if (!request) {
    notFound();
  }

  const isOverdue =
    isPast(new Date(request.deadline)) &&
    request.status !== "COMPLETED" &&
    request.status !== "REJECTED" &&
    request.status !== "CANCELLED";

  return (
    <div className="animate-fade-in space-y-8">
      {/* Back navigation + header */}
      <div className="space-y-4">
        <Link
          href="/my-actions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {request.displayId}
          </h1>
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {isOverdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 uppercase">
              <Clock className="size-3" />
              Overdue
            </span>
          )}
        </div>
        <p className="text-lg text-muted-foreground">{request.productName}</p>
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Request Details */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-primary" />
                <CardTitle>Request Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Customer" value={request.customerName} />
                <DetailItem label="Product / Flavor" value={request.productName} />
                <DetailItem
                  label="Application Category"
                  value={FLAVOR_CATEGORY_LABELS[request.flavorCategory]}
                />
                <DetailItem
                  label="Sample Type"
                  value={SAMPLE_TYPE_LABELS[request.sampleType]}
                />
                {request.flavorDesignation && (
                  <DetailItem
                    label="Flavor Designation"
                    value={FLAVOR_DESIGNATION_LABELS[request.flavorDesignation]}
                  />
                )}
                {request.physicalForm && (
                  <DetailItem
                    label="Physical Form"
                    value={PHYSICAL_FORM_LABELS[request.physicalForm]}
                  />
                )}
                <DetailItem
                  label="Quantity"
                  value={
                    request.quantityValue && request.quantityUnit
                      ? `${request.quantityValue} ${QUANTITY_UNIT_LABELS[request.quantityUnit]}`
                      : request.quantity
                  }
                />
                <DetailItem
                  label="Deadline"
                  value={
                    <span className={cn(isOverdue && "font-semibold text-red-600")}>
                      <Calendar className="mr-1 inline size-3.5" />
                      {format(new Date(request.deadline), "MMM d, yyyy")}
                    </span>
                  }
                />
                <DetailItem label="Requester" value={request.requester.name} />
                {request.targetProfile && (
                  <DetailItem
                    label="Target Flavor Profile"
                    value={request.targetProfile}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                )}
                {request.referenceProduct && (
                  <DetailItem
                    label="Reference Product"
                    value={request.referenceProduct}
                  />
                )}
                {request.regulatoryRequirements && (
                  <DetailItem
                    label="Regulatory Requirements"
                    value={request.regulatoryRequirements}
                  />
                )}
                {request.allergenInfo && (
                  <DetailItem label="Allergen Info" value={request.allergenInfo} />
                )}
                {request.shelfLife && (
                  <DetailItem label="Shelf Life" value={request.shelfLife} />
                )}
                {request.storageConditions && (
                  <DetailItem
                    label="Storage Conditions"
                    value={request.storageConditions}
                  />
                )}
                {request.specialInstructions && (
                  <DetailItem
                    label="Special Instructions"
                    value={
                      <span className="whitespace-pre-wrap">
                        {request.specialInstructions}
                      </span>
                    }
                    className="sm:col-span-2 lg:col-span-3"
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* QC Results */}
          {request.qcResult && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  {request.qcResult.outcome === "PASS" ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : request.qcResult.outcome === "FAIL" ? (
                    <XCircle className="size-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="size-4 text-amber-600" />
                  )}
                  <CardTitle>QC Results</CardTitle>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold",
                      request.qcResult.outcome === "PASS"
                        ? "bg-emerald-50 text-emerald-700"
                        : request.qcResult.outcome === "FAIL"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {QC_OUTCOME_LABELS[request.qcResult.outcome]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {/* Organoleptic grid */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["Appearance", request.qcResult.appearance],
                      ["Aroma", request.qcResult.aroma],
                      ["Taste", request.qcResult.taste],
                      ["Color", request.qcResult.color],
                    ] as const
                  ).map(([label, pass]) => (
                    <div
                      key={label}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center",
                        pass
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-red-200 bg-red-50/50",
                      )}
                    >
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          pass ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {pass ? "Pass" : "Fail"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Analytical measurements */}
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {request.qcResult.specificGravity != null && (
                    <DetailItem
                      label="Specific Gravity"
                      value={request.qcResult.specificGravity}
                      mono
                    />
                  )}
                  {request.qcResult.refractiveIndex != null && (
                    <DetailItem
                      label="Refractive Index"
                      value={request.qcResult.refractiveIndex}
                      mono
                    />
                  )}
                  {request.qcResult.pH != null && (
                    <DetailItem label="pH" value={request.qcResult.pH} mono />
                  )}
                  {request.qcResult.viscosity != null && (
                    <DetailItem
                      label="Viscosity"
                      value={request.qcResult.viscosity}
                      mono
                    />
                  )}
                  {request.qcResult.moistureContent != null && (
                    <DetailItem
                      label="Moisture Content"
                      value={`${request.qcResult.moistureContent}%`}
                      mono
                    />
                  )}
                  <DetailItem
                    label="Tested By"
                    value={request.qcResult.testedBy.name}
                  />
                  <DetailItem
                    label="Tested On"
                    value={format(
                      new Date(request.qcResult.createdAt),
                      "MMM d, yyyy HH:mm",
                    )}
                  />
                </dl>
                {request.qcResult.remarks && (
                  <div className="mt-5 rounded-lg bg-muted/50 p-3">
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                      Remarks
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {request.qcResult.remarks}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shipment Info */}
          {request.shipment && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-cyan-600" />
                  <CardTitle>Shipment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {request.shipment.carrier && (
                    <DetailItem
                      label="Carrier"
                      value={SHIPPING_CARRIER_LABELS[request.shipment.carrier]}
                    />
                  )}
                  {request.shipment.trackingNumber && (
                    <DetailItem
                      label="Tracking Number"
                      value={request.shipment.trackingNumber}
                      mono
                    />
                  )}
                  <DetailItem
                    label="Temperature"
                    value={SHIP_TEMP_LABELS[request.shipment.temperature]}
                  />
                  {request.shipment.recipientName && (
                    <DetailItem
                      label="Recipient"
                      value={request.shipment.recipientName}
                    />
                  )}
                  {request.shipment.recipientPhone && (
                    <DetailItem
                      label="Phone"
                      value={request.shipment.recipientPhone}
                    />
                  )}
                  {request.shipment.shippingAddress && (
                    <DetailItem
                      label="Shipping Address"
                      value={
                        <span className="whitespace-pre-wrap">
                          {request.shipment.shippingAddress}
                        </span>
                      }
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  )}
                  {request.shipment.notes && (
                    <DetailItem
                      label="Notes"
                      value={
                        <span className="whitespace-pre-wrap">
                          {request.shipment.notes}
                        </span>
                      }
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  )}
                  {request.shipment.shippedAt && (
                    <DetailItem
                      label="Shipped At"
                      value={format(
                        new Date(request.shipment.shippedAt),
                        "MMM d, yyyy HH:mm",
                      )}
                    />
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-violet-600" />
                <CardTitle>Images</CardTitle>
                {request.images.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {request.images.length} file{request.images.length !== 1 && "s"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {request.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {request.images.map((image) => (
                    <a
                      key={image.id}
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-xl border bg-muted transition-all hover:shadow-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No images uploaded yet.
                </p>
              )}
              <div className="mt-4">
                <ImageUpload
                  requestId={request.id}
                  gate={request.status}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <ActionButtons
            requestId={request.id}
            currentStatus={request.status}
            sampleType={request.sampleType}
            userRole={user.role}
          />

          {/* Activity Timeline */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-indigo-600" />
                <CardTitle>Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <AuditTimeline entries={request.auditLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
