import { RequestStatus, Role, SampleType } from "@/generated/prisma/client";

export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  REQUESTED:          ["APPROVED", "REJECTED", "REVISION_REQUESTED", "CANCELLED"],
  REVISION_REQUESTED: ["REQUESTED", "CANCELLED"],
  APPROVED:           ["PREPARATION", "QC_CHECK", "CANCELLED"],
  PREPARATION:        ["QC_CHECK", "CANCELLED"],
  QC_CHECK:           ["PACKING", "QC_FAILED", "CANCELLED"],
  QC_FAILED:          ["PREPARATION", "QC_CHECK", "CANCELLED"],
  PACKING:            ["SHIPPED", "CANCELLED"],
  SHIPPED:            ["COMPLETED"],
  COMPLETED:          [],
  REJECTED:           ["REQUESTED"],
  CANCELLED:          [],
};

export const STATE_ASSIGNEE: Record<RequestStatus, Role> = {
  REQUESTED:          "APPROVER",
  REVISION_REQUESTED: "REQUESTER",
  APPROVED:           "FLAVORIST",
  PREPARATION:        "FLAVORIST",
  QC_CHECK:           "QC_OFFICER",
  QC_FAILED:          "FLAVORIST",
  PACKING:            "PACKER",
  SHIPPED:            "SHIPPER",
  COMPLETED:          "REQUESTER",
  REJECTED:           "REQUESTER",
  CANCELLED:          "REQUESTER",
};

const ROLE_CAN_TRANSITION_FROM: Record<Role, RequestStatus[]> = {
  REQUESTER:  ["REVISION_REQUESTED"],
  APPROVER:   ["REQUESTED"],
  FLAVORIST:  ["APPROVED", "PREPARATION", "QC_FAILED"],
  QC_OFFICER: ["QC_CHECK"],
  PACKER:     ["PACKING"],
  SHIPPER:    ["SHIPPED"],
  ADMIN:      Object.keys(VALID_TRANSITIONS) as RequestStatus[],
};

/** Roles that can cancel a request from any cancellable state */
const CANCEL_ROLES: Role[] = ["APPROVER", "ADMIN"];

export function getValidTransitions(currentStatus: RequestStatus, sampleType: SampleType): RequestStatus[] {
  const transitions = VALID_TRANSITIONS[currentStatus] || [];

  if (currentStatus === "APPROVED") {
    if (sampleType === "OFF_SHELF") {
      return transitions.filter((s) => s !== "PREPARATION");
    }
    return transitions.filter((s) => s !== "QC_CHECK");
  }

  return transitions;
}

export function canUserTransition(userRole: Role, fromStatus: RequestStatus, toStatus?: RequestStatus): boolean {
  if (userRole === "ADMIN") return true;

  // Cancel permission — only APPROVER and ADMIN can cancel
  if (toStatus === "CANCELLED") {
    return CANCEL_ROLES.includes(userRole);
  }

  // Re-open rejected — only the original requester flow
  if (fromStatus === "REJECTED" && toStatus === "REQUESTED") {
    return userRole === "REQUESTER" || userRole === "APPROVER";
  }

  return (ROLE_CAN_TRANSITION_FROM[userRole] || []).includes(fromStatus);
}

export function getAssigneeRole(status: RequestStatus): Role {
  return STATE_ASSIGNEE[status];
}

/** Terminal statuses — requests in these states are considered closed */
export const TERMINAL_STATUSES: RequestStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];

/** Check if a status is a terminal/closed state */
export function isTerminalStatus(status: RequestStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
