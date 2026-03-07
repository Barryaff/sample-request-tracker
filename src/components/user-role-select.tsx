"use client";

import { Role } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRoleSelectProps {
  userId: string;
  currentRole: Role;
}

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(newRole: Role | null) {
    if (!newRole || newRole === currentRole) return;
    startTransition(async () => {
      await updateUserRole(userId, newRole);
    });
  }

  return (
    <Select value={currentRole} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
