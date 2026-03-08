import { AuditLog, User } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface AuditTimelineProps {
  entries: Array<AuditLog & { user: User }>;
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Gradient vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border to-border" />

      <div className="flex flex-col gap-5">
        {entries.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-3.5 pl-8">
            {/* Dot */}
            <div
              className={`absolute left-1 top-1 size-[9px] rounded-full border-2 ${
                i === 0
                  ? "border-primary bg-primary shadow-sm shadow-primary/30"
                  : "border-border bg-background"
              }`}
            />

            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
                <span className="font-semibold">{entry.user.name}</span>

                {entry.previousStatus ? (
                  <span className="flex flex-wrap items-center gap-1">
                    <StatusBadge status={entry.previousStatus} size="sm" />
                    <span className="text-muted-foreground/50">&rarr;</span>
                    <StatusBadge status={entry.newStatus} size="sm" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      created as
                    </span>
                    <StatusBadge status={entry.newStatus} size="sm" />
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="rounded-lg bg-muted/50 px-2.5 py-1.5 text-[13px] text-muted-foreground">
                  {entry.notes}
                </p>
              )}

              <time className="text-[11px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
