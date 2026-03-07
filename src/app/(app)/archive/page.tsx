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

export default async function ArchivePage() {
  const requests = await prisma.sampleRequest.findMany({
    where: {
      status: {
        in: ["COMPLETED", "REJECTED"] satisfies RequestStatus[],
      },
    },
    include: { requester: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Archive</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No archived requests yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Link
                    href={`/requests/${request.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {request.displayId}
                  </Link>
                </TableCell>
                <TableCell>{request.productName}</TableCell>
                <TableCell>{request.customerName}</TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(request.updatedAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
