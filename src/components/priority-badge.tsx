import { Priority } from "@/generated/prisma/client";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
}

const URGENT_PRIORITIES = new Set<Priority>(["URGENT", "CRITICAL"]);

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const isUrgent = URGENT_PRIORITIES.has(priority);

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap",
        config.bgClass,
        config.textClass,
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          config.dotClass,
          isUrgent && "animate-pulse-soft",
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
