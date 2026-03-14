import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/client";
import { sendSlackNotification } from "@/lib/slack";
import { getValidTransitions, canUserTransition, STATE_ASSIGNEE } from "@/lib/workflow-shared";

export { getValidTransitions, canUserTransition, getAssigneeRole } from "@/lib/workflow-shared";

export async function transitionState(
  requestId: string,
  toStatus: RequestStatus,
  userId: string,
  notes?: string,
) {
  const request = await prisma.sampleRequest.findUnique({
    where: { id: requestId },
    include: { requester: true },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  if (!canUserTransition(user.role, request.status, toStatus)) {
    throw new Error("You do not have permission to perform this action");
  }

  const validNextStatuses = getValidTransitions(request.status, request.sampleType);
  if (!validNextStatuses.includes(toStatus)) {
    throw new Error(
      `Invalid transition from ${request.status} to ${toStatus}`,
    );
  }

  const newAssigneeRole = STATE_ASSIGNEE[toStatus];

  const [updatedRequest] = await prisma.$transaction([
    prisma.sampleRequest.update({
      where: { id: requestId },
      data: {
        status: toStatus,
        currentAssigneeRole: newAssigneeRole,
      },
      include: { requester: true },
    }),
    prisma.auditLog.create({
      data: {
        requestId,
        userId,
        previousStatus: request.status,
        newStatus: toStatus,
        notes,
      },
    }),
  ]);

  // Fire-and-forget Slack notification
  sendSlackNotification({
    requestDisplayId: request.displayId,
    customerName: request.customerName,
    productName: request.productName,
    previousStatus: request.status,
    newStatus: toStatus,
    actorName: user.name,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${request.id}`,
  }).catch((err) => {
    console.error("Slack notification failed:", err);
  });

  return updatedRequest;
}
