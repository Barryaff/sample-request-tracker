"use client";

import { useState, useTransition } from "react";
import { RequestStatus, Role, SampleType } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";
import { getValidTransitions, canUserTransition } from "@/lib/workflow-shared";
import { transitionRequestStatus } from "@/app/actions/request-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ActionButtonsProps {
  requestId: string;
  currentStatus: RequestStatus;
  sampleType: SampleType;
  userRole: Role;
}

const NOTES_REQUIRED_STATUSES = new Set<RequestStatus>([
  "REJECTED",
  "REVISION_REQUESTED",
  "QC_FAILED",
]);

export function ActionButtons({
  requestId,
  currentStatus,
  sampleType,
  userRole,
}: ActionButtonsProps) {
  const [confirmingStatus, setConfirmingStatus] =
    useState<RequestStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canUserTransition(userRole, currentStatus)) {
    return null;
  }

  const validTransitions = getValidTransitions(currentStatus, sampleType);

  if (validTransitions.length === 0) {
    return null;
  }

  function handleClick(toStatus: RequestStatus) {
    setError(null);

    if (confirmingStatus === toStatus) {
      // Already confirming this one -- user clicked "Confirm"
      handleConfirm(toStatus);
      return;
    }

    // Start confirmation flow
    setConfirmingStatus(toStatus);
    setNotes("");
  }

  function handleCancel() {
    setConfirmingStatus(null);
    setNotes("");
    setError(null);
  }

  function handleConfirm(toStatus: RequestStatus) {
    const requiresNotes = NOTES_REQUIRED_STATUSES.has(toStatus);
    if (requiresNotes && !notes.trim()) {
      setError("Notes are required for this action.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await transitionRequestStatus(
          requestId,
          toStatus,
          notes.trim() || undefined,
        );
        if (!result.success) {
          setError(result.error);
        } else {
          setConfirmingStatus(null);
          setNotes("");
          setError(null);
        }
      } catch {
        setError("An unexpected error occurred.");
      }
    });
  }

  function getButtonVariant(
    toStatus: RequestStatus,
  ): "default" | "destructive" | "outline" {
    if (NOTES_REQUIRED_STATUSES.has(toStatus)) {
      return "destructive";
    }
    return "default";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {validTransitions.map((toStatus) => (
          <Button
            key={toStatus}
            variant={getButtonVariant(toStatus)}
            size="sm"
            disabled={
              isPending ||
              (confirmingStatus !== null && confirmingStatus !== toStatus)
            }
            onClick={() => handleClick(toStatus)}
          >
            {STATUS_CONFIG[toStatus].label}
          </Button>
        ))}
      </div>

      {confirmingStatus && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium">
            Transition to{" "}
            <span className="font-semibold">
              {STATUS_CONFIG[confirmingStatus].label}
            </span>
            ?
          </p>

          {NOTES_REQUIRED_STATUSES.has(confirmingStatus) && (
            <Textarea
              placeholder="Provide a reason (required)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleConfirm(confirmingStatus)}
            >
              {isPending ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
