import Link from "next/link";
import { SampleRequest, User } from "@/generated/prisma/client";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { format, isPast } from "date-fns";
import { CalendarIcon, ChevronRight, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: SampleRequest & { requester: User };
}

const TERMINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "CANCELLED"]);

export function RequestCard({ request }: RequestCardProps) {
  const isOverdue =
    isPast(new Date(request.deadline)) &&
    !TERMINAL_STATUSES.has(request.status);
  const priorityConfig = PRIORITY_CONFIG[request.priority];

  return (
    <Link href={`/requests/${request.id}`} className="group block">
      <div
        className={cn(
          "card-hover relative overflow-hidden rounded-xl border-l-[3px] bg-card ring-1 ring-foreground/[0.06]",
          priorityConfig.borderClass,
        )}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Left section: main info */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Top row: ID + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold tracking-wide text-muted-foreground/80">
                {request.displayId}
              </span>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>

            {/* Product name */}
            <h3 className="truncate text-[15px] font-semibold text-foreground">
              {request.productName}
            </h3>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {request.customerName}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon className="size-3" />
                {request.requester.name}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "font-semibold text-red-600",
                )}
              >
                <CalendarIcon className="size-3" />
                {format(new Date(request.deadline), "MMM d, yyyy")}
                {isOverdue && (
                  <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                    Overdue
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right: chevron */}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
