import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { UserRoleSelect } from "@/components/user-role-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield } from "lucide-react";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles and permissions for all users
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/[0.06]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="transition-colors hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="default">
                      {user.image ? (
                        <AvatarImage
                          src={user.image}
                          alt={user.name ?? "User"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <UserRoleSelect
                    userId={user.id}
                    currentRole={user.role}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
