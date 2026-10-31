"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, UserButton } from "@clerk/nextjs";
import React from "react";

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
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center">
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
