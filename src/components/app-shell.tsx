"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, FlaskConical, LogOut } from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { signOutAction } from "@/app/actions/auth-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  };
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/my-actions", label: "My Actions" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests/new", label: "New Request" },
  { href: "/archive", label: "Archive" },
];

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allLinks = [
    ...NAV_LINKS,
    ...(user.role === "ADMIN"
      ? [{ href: "/admin/users", label: "Admin" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-white dark:bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Left: App branding */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <FlaskConical className="size-5 text-primary" />
            <span className="hidden sm:inline">Sample Request Tracker</span>
            <span className="sm:hidden">SRT</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="ml-8 hidden items-center gap-1 md:flex">
            {allLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User menu */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-foreground">{user.name}</span>
              <Badge variant="secondary" className="text-[11px]">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Avatar size="default">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  ) : null}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <div className="px-1.5 py-1">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
                  Role: {ROLE_LABELS[user.role]}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-0"
                  onSelect={(e) => e.preventDefault()}
                >
                  <form action={signOutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-1.5 py-1 text-sm"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
              {allLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  ) : null}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <Badge variant="secondary" className="ml-auto text-[11px]">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
