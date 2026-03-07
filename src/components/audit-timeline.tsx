import { AuditLog, User } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface AuditTimelineProps {
  entries: Array<AuditLog & { user: User }>;
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No audit history yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 h-full w-px bg-border" />

      <div className="flex flex-col gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-4 pl-9">
            {/* Dot */}
            <div className="absolute left-1.5 top-1.5 size-3 rounded-full border-2 border-primary bg-background" />

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{entry.user.name}</span>

                {entry.previousStatus ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={entry.previousStatus} />
                    <span className="text-muted-foreground">&rarr;</span>
                    <StatusBadge status={entry.newStatus} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">created as</span>
                    <StatusBadge status={entry.newStatus} />
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="text-sm text-muted-foreground">{entry.notes}</p>
              )}

              <time className="text-xs text-muted-foreground">
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
