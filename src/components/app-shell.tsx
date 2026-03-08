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
  PlusCircle,
  Archive,
  Shield,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { signOutAction } from "@/app/actions/auth-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  { href: "/requests/new", label: "New Request", icon: PlusCircle },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allLinks = [
    ...NAV_LINKS,
    ...(user.role === "ADMIN"
      ? [{ href: "/admin/users", label: "Admin", icon: Shield }]
      : []),
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
            <FlaskConical className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-tight tracking-tight text-white">
              SRT
            </span>
            <span className="text-[9px] font-medium tracking-[0.15em] text-white/40 uppercase">
              Sample Tracker
            </span>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3">
        {allLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm shadow-black/10"
                  : "text-white/50 hover:bg-white/[0.07] hover:text-white/80",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] transition-colors",
                  isActive ? "text-white" : "text-white/40 group-hover:text-white/70",
                )}
              />
              {link.label}
              {isActive && (
                <ChevronRight className="ml-auto size-3.5 text-white/30" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar size="default">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "User"} />
            ) : null}
            <AvatarFallback className="bg-white/10 text-[10px] font-bold text-white/70">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white/90">
              {user.name}
            </p>
            <p className="truncate text-[10px] font-medium text-white/30">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.07] hover:text-white/60"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-white/[0.04] bg-[#1A1512] md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-[#1A1512] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-[240px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <span className="text-sm font-bold">SRT</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{user.name}</span>
            <Avatar size="default">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name ?? "User"} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gradient-to-br from-background via-background to-orange-50/30">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
