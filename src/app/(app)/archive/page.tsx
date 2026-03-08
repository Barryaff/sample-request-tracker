import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive } from "lucide-react";

export default async function ArchivePage() {
  const requests = await prisma.sampleRequest.findMany({
    where: {
      status: {
        in: ["COMPLETED", "REJECTED", "CANCELLED"] satisfies RequestStatus[],
      },
    },
    include: { requester: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed, rejected, and cancelled requests
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
            <Archive className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            No archived requests yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/[0.06]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell>
                    <Link
                      href={`/requests/${request.id}`}
                      className="font-mono text-xs font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                    >
                      {request.displayId}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {request.productName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.customerName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(request.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
