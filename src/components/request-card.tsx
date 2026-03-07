import Link from "next/link";
import { SampleRequest, User } from "@/generated/prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { format, isPast } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface RequestCardProps {
  request: SampleRequest & { requester: User };
}

const TERMINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "SHIPPED"]);

export function RequestCard({ request }: RequestCardProps) {
  const isOverdue =
    isPast(new Date(request.deadline)) &&
    !TERMINAL_STATUSES.has(request.status);

  return (
    <Link href={`/requests/${request.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-sm">
              {request.displayId}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={request.priority} />
              <StatusBadge status={request.status} />
            </div>
          </div>
          <CardDescription className="truncate">
            {request.productName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{request.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Requester</span>
              <span className="font-medium">{request.requester.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deadline</span>
              <span
                className={
                  isOverdue
                    ? "flex items-center gap-1 font-medium text-red-600"
                    : "flex items-center gap-1 text-muted-foreground"
                }
              >
                <CalendarIcon className="size-3.5" />
                {format(new Date(request.deadline), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
