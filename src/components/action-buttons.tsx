"use client";

import { useState, useTransition } from "react";
import { RequestStatus, Role, SampleType } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";
import { getValidTransitions, canUserTransition } from "@/lib/workflow-shared";
import { transitionRequestStatus } from "@/app/actions/request-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  "CANCELLED",
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

  const allTransitions = getValidTransitions(currentStatus, sampleType);
  const validTransitions = allTransitions.filter((toStatus) =>
    canUserTransition(userRole, currentStatus, toStatus),
  );

  if (validTransitions.length === 0) {
    return null;
  }

  function handleClick(toStatus: RequestStatus) {
    setError(null);

    if (confirmingStatus === toStatus) {
      handleConfirm(toStatus);
      return;
    }

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
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <ArrowRight className="size-4 text-primary" />
          <CardTitle>Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex flex-wrap gap-2">
          {validTransitions.map((toStatus) => {
            const config = STATUS_CONFIG[toStatus];
            return (
              <Button
                key={toStatus}
                variant={getButtonVariant(toStatus)}
                size="sm"
                disabled={
                  isPending ||
                  (confirmingStatus !== null && confirmingStatus !== toStatus)
                }
                onClick={() => handleClick(toStatus)}
                className="gap-1.5"
              >
                <span
                  className={cn("size-1.5 rounded-full", config.dotClass)}
                />
                {config.label}
              </Button>
            );
          })}
        </div>

        {confirmingStatus && (
          <div className="animate-slide-up rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Transition to{" "}
              <span className="font-bold">
                {STATUS_CONFIG[confirmingStatus].label}
              </span>
              ?
            </p>

            {NOTES_REQUIRED_STATUSES.has(confirmingStatus) && (
              <Textarea
                placeholder="Provide a reason (required)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 min-h-20"
              />
            )}

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                <AlertTriangle className="size-3.5" />
                {error}
              </div>
            )}

            <div className="mt-3 flex gap-2">
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
      </CardContent>
    </Card>
  );
}
