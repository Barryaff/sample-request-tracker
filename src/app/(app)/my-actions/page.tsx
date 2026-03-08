import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { RequestStatus, Role } from "@/generated/prisma/client";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";
import { ROLE_LABELS } from "@/lib/constants";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { isPast } from "date-fns";

function getActionStatuses(role: Role, userId: string) {
  const where: Record<string, unknown> = {};

  switch (role) {
    case "APPROVER":
      where.status = "REQUESTED" satisfies RequestStatus;
      break;
    case "FLAVORIST":
      where.status = {
        in: [
          "APPROVED",
          "PREPARATION",
          "QC_FAILED",
        ] satisfies RequestStatus[],
      };
      break;
    case "QC_OFFICER":
      where.status = "QC_CHECK" satisfies RequestStatus;
      break;
    case "PACKER":
      where.status = "PACKING" satisfies RequestStatus;
      break;
    case "SHIPPER":
      where.status = "SHIPPED" satisfies RequestStatus;
      break;
    case "REQUESTER":
      where.status = "REVISION_REQUESTED" satisfies RequestStatus;
      where.requesterId = userId;
      break;
    case "ADMIN":
      where.status = {
        notIn: ["COMPLETED", "REJECTED", "CANCELLED"] satisfies RequestStatus[],
      };
      break;
  }

  return where;
}

export default async function MyActionsPage() {
  const user = await getCurrentUser();
  const where = getActionStatuses(user.role, user.id);

  const requests = await prisma.sampleRequest.findMany({
    where,
    include: { requester: true },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
  });

  const overdueCount = requests.filter(
    (r) => isPast(new Date(r.deadline)),
  ).length;
  const urgentCount = requests.filter(
    (r) => r.priority === "URGENT" || r.priority === "CRITICAL",
  ).length;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Actions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks requiring your attention as{" "}
          <span className="font-medium text-foreground/70">
            {ROLE_LABELS[user.role]}
          </span>
        </p>
      </div>

      {/* Stats cards */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/[0.06]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{requests.length}</p>
              <p className="text-xs text-muted-foreground">Pending Actions</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/[0.06]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/[0.06]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{urgentCount}</p>
              <p className="text-xs text-muted-foreground">Urgent / Critical</p>
            </div>
          </div>
        </div>
      )}

      {/* Request list */}
      {requests.length === 0 ? (
        <EmptyState
          message="All caught up"
          description="No actions require your attention right now. Great work!"
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request, i) => (
            <div
              key={request.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <RequestCard request={request} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
