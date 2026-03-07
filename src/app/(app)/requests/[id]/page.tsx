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
  SAMPLE_TYPE_LABELS,
} from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, isPast } from "date-fns";

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
      auditLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      images: true,
    },
  });

  if (!request) {
    notFound();
  }

  const isOverdue =
    isPast(new Date(request.deadline)) &&
    request.status !== "COMPLETED" &&
    request.status !== "REJECTED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {request.displayId}
        </h1>
        <StatusBadge status={request.status} />
        <PriorityBadge priority={request.priority} />
      </div>

      {/* Info Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Customer
              </dt>
              <dd className="mt-1 text-sm">{request.customerName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Product
              </dt>
              <dd className="mt-1 text-sm">{request.productName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Flavor Category
              </dt>
              <dd className="mt-1 text-sm">
                {FLAVOR_CATEGORY_LABELS[request.flavorCategory]}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Sample Type
              </dt>
              <dd className="mt-1 text-sm">
                {SAMPLE_TYPE_LABELS[request.sampleType]}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Quantity
              </dt>
              <dd className="mt-1 text-sm">{request.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Deadline
              </dt>
              <dd className="mt-1 text-sm">
                {format(new Date(request.deadline), "MMM d, yyyy")}
                {isOverdue && (
                  <span className="ml-2 text-xs font-medium text-red-600">
                    OVERDUE
                  </span>
                )}
              </dd>
            </div>
            {request.specialInstructions && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  Special Instructions
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {request.specialInstructions}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Requester
              </dt>
              <dd className="mt-1 text-sm">{request.requester.name}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          {request.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {request.images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
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

      <Separator />

      {/* Action Buttons */}
      <ActionButtons
        requestId={request.id}
        currentStatus={request.status}
        sampleType={request.sampleType}
        userRole={user.role}
      />

      <Separator />

      {/* Audit Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline entries={request.auditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
