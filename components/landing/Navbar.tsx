"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Network, Workflow } from "lucide-react";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand Logo with Signature Gold Accent */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
            <Network className="h-4 w-4 text-zinc-950 font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-foreground">
              ArchFlow
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ffc507]/10 text-[#ffee72] border border-[#ffdf27]/20 font-semibold">
              Studio
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="default" size="sm" className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all shadow-xs">
                  <Workflow className="h-4 w-4 text-zinc-950" />
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
                <Button size="sm" className="group font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all shadow-xs">
                  <span>Start Designing</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-zinc-950" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
