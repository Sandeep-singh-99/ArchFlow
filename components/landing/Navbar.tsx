"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Network, Workflow } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand Logo with Solid Emerald Accent */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
            <Network className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-foreground">
              ArchFlow
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              Studio
            </span>
          </div>
        </Link>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="default" size="sm" className="gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-xs">
                  <Workflow className="h-4 w-4" />
                  <span className="hidden sm:inline">Go to Canvas</span>
                  <span className="sm:hidden">Canvas</span>
                </Button>
              </Link>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="group font-medium bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-xs">
                  <span>Start Designing</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
