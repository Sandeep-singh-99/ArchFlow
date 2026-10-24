"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, UserButton } from "@clerk/nextjs";
import React from "react";
import { Network, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground cursor-pointer" />
        <div className="h-4 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            workspace //
          </span>
          <span className="text-sm font-semibold text-foreground">
            Database Schema Studio
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8 rounded-lg border border-border",
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
