"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, UserButton } from "@clerk/nextjs";
import React from "react";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/85 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Navigation & Workspace Context */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground cursor-pointer" />
        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            workspace //
          </span>
          <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            Database Schema Studio
          </span>
        </div>

        {/* Live Operational Health Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>Engine Online</span>
        </div>
      </div>

      {/* Right: Quick Links, Plan & Profile */}
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard/pricing" className="hidden sm:inline-flex">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Plans</span>
          </Button>
        </Link>

        {/* User Profile Container */}
        <div className="flex items-center pl-1">
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-8 w-8 rounded-lg border border-border/80 shadow-2xs",
                  userButtonPopoverCard:
                    "border border-border/80 bg-card text-foreground shadow-xl",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
