import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { RequestStatus, Role } from "@/generated/prisma/client";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";
import { ROLE_LABELS } from "@/lib/constants";
import { CheckCircle, Clock, AlertTriangle, Zap } from "lucide-react";
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
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1512] via-[#2A2017] to-[#1A1512] px-8 py-8 text-white shadow-xl shadow-black/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,96,28,0.2),transparent_60%)]" />
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <p className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-primary/80 uppercase">
            {ROLE_LABELS[user.role]}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {requests.length === 0
              ? "You're all caught up. No pending actions."
              : `You have ${requests.length} item${requests.length !== 1 ? "s" : ""} that need your attention.`}
          </p>
        </div>

        {/* Stats row */}
        {requests.length > 0 && (
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/[0.06]">
              <div className="mb-1 flex items-center gap-2 text-blue-400">
                <Clock className="size-4" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Pending</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{requests.length}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/[0.06]">
              <div className="mb-1 flex items-center gap-2 text-red-400">
                <AlertTriangle className="size-4" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Overdue</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{overdueCount}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/[0.06]">
              <div className="mb-1 flex items-center gap-2 text-amber-400">
                <Zap className="size-4" />
                <span className="text-[10px] font-semibold tracking-wider uppercase">Urgent</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{urgentCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <EmptyState
          icon={<CheckCircle />}
          message="All caught up"
          description="No actions require your attention right now. Great work!"
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-muted-foreground/60 uppercase">
            Pending Actions
          </h2>
          {requests.map((request, i) => (
            <div
              key={request.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <RequestCard request={request} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
