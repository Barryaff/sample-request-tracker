import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";

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
      status: { notIn: ["COMPLETED", "REJECTED"] satisfies RequestStatus[] },
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {ACTIVE_STATUSES.map((status) => {
        const group = grouped[status];
        if (!group || group.length === 0) return null;

        const config = STATUS_CONFIG[status];

        return (
          <section key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{config.label}</h2>
              <Badge variant="secondary">{group.length}</Badge>
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
