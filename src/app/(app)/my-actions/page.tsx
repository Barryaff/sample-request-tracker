import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { RequestStatus, Role } from "@/generated/prisma/client";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

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
        notIn: ["COMPLETED", "REJECTED"] satisfies RequestStatus[],
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My Actions</h1>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>

      {requests.length === 0 ? (
        <EmptyState message="No actions require your attention right now." />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
