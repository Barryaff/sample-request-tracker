"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  FlaskConical,
  LogOut,
  ListTodo,
  LayoutDashboard,
  Plus,
  Archive,
  Shield,
} from "lucide-react";
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
  { href: "/my-actions", label: "My Actions", icon: ListTodo },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests/new", label: "New Request", icon: Plus },
  { href: "/archive", label: "Archive", icon: Archive },
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
      ? [{ href: "/admin/users", label: "Admin", icon: Shield }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium navigation bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gradient-to-r from-[#E85D04] via-[#F37021] to-[#F37021] shadow-lg shadow-orange-500/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Left: App branding */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-semibold text-white"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 shadow-inner transition-transform duration-200 group-hover:scale-105">
              <FlaskConical className="size-5 text-white" />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-[15px] font-bold leading-tight tracking-tight">
                Sample Request Tracker
              </span>
              <span className="text-[10px] font-normal tracking-widest text-white/60 uppercase">
                Advanced Flavors & Fragrances
              </span>
            </div>
            <span className="text-lg font-bold sm:hidden">SRT</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="ml-10 hidden items-center gap-0.5 md:flex">
            {allLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="size-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User menu */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="text-sm font-medium text-white/90">
                {user.name}
              </span>
              <Badge
                variant="secondary"
                className="border-0 bg-white/15 text-[10px] font-semibold tracking-wide text-white/90 uppercase"
              >
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full ring-2 ring-white/20 outline-none transition-all duration-200 hover:ring-white/40 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F37021]">
                <Avatar size="default">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  ) : null}
                  <AvatarFallback className="bg-white/20 text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                <div className="px-2 py-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold tracking-wide uppercase"
                  >
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="p-0"
                  onSelect={(e) => e.preventDefault()}
                >
                  <form action={signOutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <LogOut className="size-3.5" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
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
          <div className="animate-slide-up border-t border-white/10 md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
              {allLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-white/10 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  ) : null}
                  <AvatarFallback className="bg-white/20 text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {user.name}
                  </span>
                  <span className="text-xs text-white/60">{user.email}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-auto border-0 bg-white/15 text-[10px] font-semibold tracking-wide text-white/90 uppercase"
                >
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
