import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES: RequestStatus[] = [
  "REQUESTED",
  "APPROVED",
  "REVISION_REQUESTED",
  "PREPARATION",
  "QC_CHECK",
  "QC_FAILED",
  "PACKING",
  "SHIPPED",
];

export default async function DashboardPage() {
  const requests = await prisma.sampleRequest.findMany({
    where: {
      status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] satisfies RequestStatus[] },
    },
    include: { requester: true },
    orderBy: { deadline: "asc" },
  });

  const grouped = ACTIVE_STATUSES.reduce(
    (acc, status) => {
      acc[status] = requests.filter((r) => r.status === status);
      return acc;
    },
    {} as Record<RequestStatus, typeof requests>,
  );

  const totalActive = requests.length;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all active sample requests through the pipeline
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-full bg-card px-5 py-2.5 shadow-sm ring-1 ring-black/[0.04]">
          <Activity className="size-4 text-primary" />
          <span className="text-xl font-bold tabular-nums">{totalActive}</span>
          <span className="text-xs text-muted-foreground">active</span>
        </div>
      </div>

      {/* Visual pipeline */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.04]">
        <div className="grid grid-cols-4 gap-px bg-border lg:grid-cols-8">
          {ACTIVE_STATUSES.map((status) => {
            const count = grouped[status]?.length ?? 0;
            const config = STATUS_CONFIG[status];
            const pct = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
            return (
              <div
                key={status}
                className="flex flex-col items-center gap-2 bg-card px-2 py-5 text-center"
              >
                <div className={cn("size-3 rounded-full", config.dotClass)} />
                <span className="text-2xl font-bold tabular-nums">{count}</span>
                <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/60 uppercase">
                  {config.label}
                </span>
                {/* Mini bar */}
                <div className="h-1 w-full max-w-[60px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", config.dotClass)}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status groups */}
      {ACTIVE_STATUSES.map((status) => {
        const group = grouped[status];
        if (!group || group.length === 0) return null;

        const config = STATUS_CONFIG[status];

        return (
          <section key={status} className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={cn("size-3 rounded-full", config.dotClass)}
              />
              <h2 className="text-base font-bold">{config.label}</h2>
              <Badge
                variant="secondary"
                className="font-bold tabular-nums"
              >
                {group.length}
              </Badge>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="space-y-3">
              {group.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
