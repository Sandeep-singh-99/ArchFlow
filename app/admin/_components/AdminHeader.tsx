"use client";

import React, { useContext } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminHeader() {
  const { user } = useUser();
  const { userDetails } = useContext(UserDetailContext);
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/admin") return "Platform Overview";
    if (pathname.startsWith("/admin/users")) return "User Directory & Access Control";
    if (pathname.startsWith("/admin/analytics")) return "Engine & Architecture Analytics";
    if (pathname.startsWith("/admin/earnings")) return "Earnings & Subscriptions";
    if (pathname.startsWith("/admin/feedback")) return "User Feedback & Bug Inbox";
    return "Admin Command Center";
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
        <div className="h-4 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400 hidden sm:block" />
          <h1 className="font-semibold text-sm text-foreground">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10 py-0.5 px-2.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Convex Realtime Synced</span>
        </Badge>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Studio</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
