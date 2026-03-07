import { RequestStatus, Role, SampleType } from "@/generated/prisma/client";

export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  REQUESTED:          ["APPROVED", "REJECTED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["REQUESTED"],
  APPROVED:           ["PREPARATION", "QC_CHECK"],
  PREPARATION:        ["QC_CHECK"],
  QC_CHECK:           ["PACKING", "QC_FAILED"],
  QC_FAILED:          ["PREPARATION", "QC_CHECK"],
  PACKING:            ["SHIPPED"],
  SHIPPED:            ["COMPLETED"],
  COMPLETED:          [],
  REJECTED:           [],
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

export function canUserTransition(userRole: Role, fromStatus: RequestStatus): boolean {
  if (userRole === "ADMIN") return true;
  return (ROLE_CAN_TRANSITION_FROM[userRole] || []).includes(fromStatus);
}

export function getAssigneeRole(status: RequestStatus): Role {
  return STATE_ASSIGNEE[status];
}
