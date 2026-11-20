"use client";

import React, { useState } from "react";
import { Agent } from "@/types/AgentTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Users,
  Clock,
  BarChart3,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface ShareProjectDialogProps {
  agentDetail?: Agent;
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 60) {
    return `${totalSeconds || 0}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export default function ShareProjectDialog({ agentDetail }: ShareProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const agentId = agentDetail?.agentId || "";
  const previewUrl =
    typeof window !== "undefined" && agentId
      ? `${window.location.origin}/preview/${agentId}`
      : agentId
        ? `/preview/${agentId}`
        : "";

  // Live analytics for this specific architecture
  const stats = useQuery(
    api.analytics.GetAgentAnalytics,
    agentId ? { agentId } : "skip"
  );

  const handleCopy = async () => {
    if (!previewUrl) return;
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/preview/${agentId}`
        : previewUrl;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpen = () => {
    if (typeof window !== "undefined" && agentId) {
      window.open(`${window.location.origin}/preview/${agentId}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 sm:px-3 text-xs font-medium border-border/80 hover:bg-muted/70 text-foreground flex items-center gap-1.5 transition-all shadow-2xs"
          title="Share Architecture Preview"
        >
          <Share2 className="h-3.5 w-3.5 text-[#ffee72]" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#ffc507]/15 border border-[#ffdf27]/30 flex items-center justify-center text-[#ffee72]">
              <Share2 className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Share Architecture Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate a live, read-only preview link for teammates or clients.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Permission Notice */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <Globe2 className="size-4 text-emerald-400 shrink-0" />
              <div className="text-xs leading-tight">
                <span className="font-semibold text-foreground">Public View-Only</span>
                <p className="text-[11px] text-muted-foreground truncate">
                  Recipients cannot edit, add, or alter your schema
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0"
            >
              <ShieldCheck className="size-3 mr-1 text-emerald-400" />
              Locked
            </Badge>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Preview Link</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                /preview/{agentId ? agentId.slice(0, 8) + "..." : ""}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={previewUrl || "Loading link..."}
                className="h-9 font-mono text-xs bg-muted/30 border-border/80 focus-visible:ring-[#ffc507]/40 select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-9 px-3 shrink-0 border-border/80 hover:bg-muted text-foreground transition-all"
                title="Copy share link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                    <span className="text-xs text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-border/50 text-center">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="size-3 text-sky-400" />
                <span>Views</span>
              </div>
              <p className="text-sm font-bold font-mono text-foreground">
                {stats?.totalViews ?? 0}
              </p>
            </div>
            <div className="space-y-0.5 border-x border-border/40">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Users className="size-3 text-[#ffee72]" />
                <span>Visitors</span>
              </div>
              <p className="text-sm font-bold font-mono text-foreground">
                {stats?.uniqueVisitors ?? 0}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3 text-emerald-400" />
                <span>Total Time</span>
              </div>
              <p className="text-sm font-bold font-mono text-foreground">
                {formatDuration(stats?.totalDurationSeconds ?? 0)}
              </p>
            </div>
          </div>

          {/* Actions & Deep Link to Analytics */}
          <div className="flex items-center justify-between pt-1">
            <Link
              href={`/dashboard/analytics?agentId=${agentId}`}
              className="text-xs font-medium text-[#ffee72] hover:underline flex items-center gap-1 transition-colors"
            >
              <BarChart3 className="size-3.5" />
              <span>Full Analytics Dashboard →</span>
            </Link>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleOpen}
              className="h-8 text-xs font-medium flex items-center gap-1.5"
            >
              <ExternalLink className="size-3.5" />
              <span>Open Preview</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
