"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Network, Workflow } from "lucide-react";

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <nav
        className={`pointer-events-auto flex items-center justify-between w-full max-w-5xl h-14 sm:h-16 px-4 sm:px-6 rounded-full border transition-all duration-300 ${
          scrolled
            ? "bg-black/60 border-white/15 shadow-2xl shadow-black/60 backdrop-blur-xl"
            : "bg-black/35 border-white/10 shadow-lg shadow-black/20 backdrop-blur-md hover:bg-black/45"
        }`}
      >
        {/* Brand Logo with Signature Gold Accent */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <Network className="h-4 w-4 text-zinc-950 font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
                ArchFlow
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ffc507]/10 text-[#ffee72] border border-[#ffdf27]/20 font-semibold">
                DB Flow
              </span>
            </div>
          </Link>
        </div>


        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all shadow-xs rounded-full px-3.5 sm:px-4"
                >
                  <Workflow className="h-4 w-4 text-zinc-950" />
                  <span className="hidden sm:inline">Go to DB Canvas</span>
                  <span className="sm:hidden">DB Canvas</span>
                </Button>
              </Link>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-4 text-xs sm:text-sm"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="group font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all shadow-xs rounded-full px-3.5 sm:px-4 text-xs sm:text-sm"
                >
                  <span>Design DB Flow</span>
                  <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5 text-zinc-950" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
