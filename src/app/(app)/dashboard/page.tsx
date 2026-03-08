import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

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

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of all active sample requests
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium ring-1 ring-foreground/[0.06] sm:flex">
          <Activity className="size-4 text-primary" />
          <span className="tabular-nums">{requests.length}</span>
          <span className="text-muted-foreground">active</span>
        </div>
      </div>

      {/* Pipeline overview — mini status bar */}
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/[0.06]">
        <div className="flex divide-x divide-border">
          {ACTIVE_STATUSES.map((status) => {
            const count = grouped[status]?.length ?? 0;
            const config = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className="flex flex-1 flex-col items-center gap-1 px-2 py-4 text-center"
              >
                <span className={`size-2 rounded-full ${config.dotClass}`} />
                <span className="text-lg font-bold tabular-nums">{count}</span>
                <span className="hidden text-[10px] font-medium text-muted-foreground lg:block">
                  {config.label}
                </span>
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
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${config.dotClass}`}
                />
                <h2 className="text-lg font-semibold">{config.label}</h2>
              </div>
              <Badge
                variant="secondary"
                className="tabular-nums"
              >
                {group.length}
              </Badge>
              <div className="flex-1 border-t border-border/50" />
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
