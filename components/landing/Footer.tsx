"use client";
import React from "react";
import Link from "next/link";
import { Network, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 flex items-center justify-center">
                <Network className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-foreground">ArchFlow</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              The next-generation AI System Design & Architecture Flowchart Studio.
              Turn complex distributed systems into interactive, verifiable diagrams.
            </p>
            <div className="flex items-center gap-3 text-muted-foreground pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:text-foreground hover:border-foreground/40 transition-colors shadow-2xs"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:text-foreground hover:border-foreground/40 transition-colors shadow-2xs"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center hover:text-foreground hover:border-foreground/40 transition-colors shadow-2xs"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column: Templates */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
              Architecture Templates
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#templates" className="hover:text-foreground transition-colors">
                  Ride Hailing (Uber)
                </Link>
              </li>
              <li>
                <Link href="#templates" className="hover:text-foreground transition-colors">
                  Flash Sale (Amazon)
                </Link>
              </li>
              <li>
                <Link href="#templates" className="hover:text-foreground transition-colors">
                  Video Streaming (Netflix)
                </Link>
              </li>
              <li>
                <Link href="#templates" className="hover:text-foreground transition-colors">
                  Distributed Rate Limiter
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Patterns */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
              System Patterns
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  CQRS & Event Sourcing
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Saga Distributed Transactions
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Circuit Breaker & Fallback
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Cache-Aside & Read-Through
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
              Studio
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Architecture Canvas
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                  Traffic Simulator
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="font-mono">
            © {new Date().getFullYear()} ArchFlow Studio. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
