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
          "card-lift relative overflow-hidden rounded-2xl border-l-4 bg-card p-5 shadow-sm shadow-black/[0.03] ring-1 ring-black/[0.04]",
          priorityConfig.borderClass,
        )}
      >
        {/* Top: ID + badges */}
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-muted-foreground">
            {request.displayId}
          </span>
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          <ChevronRight className="ml-auto size-4 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        {/* Product name */}
        <h3 className="mb-2.5 text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
          {request.productName}
        </h3>

        {/* Meta grid */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/70">
            {request.customerName}
          </span>
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-3 text-muted-foreground/50" />
            {request.requester.name}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              isOverdue && "font-bold text-red-600",
            )}
          >
            <CalendarIcon className="size-3 text-muted-foreground/50" />
            {format(new Date(request.deadline), "MMM d, yyyy")}
            {isOverdue && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-red-700 uppercase">
                Overdue
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
