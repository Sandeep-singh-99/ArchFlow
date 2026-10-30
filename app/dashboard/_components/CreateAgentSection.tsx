"use client";
import { Button } from "@/components/ui/button";
import { Loader, Plus, Workflow, Sparkles, Zap, Lock, AlertCircle, ArrowRight } from "lucide-react";
import React, { useContext, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const suggestedTemplates = [
  "E-Commerce PostgreSQL Schema",
  "SaaS Multi-Tenant Database",
  "FinTech Ledger & Transactions",
  "Healthcare Patient Records",
  "Social Network Graph & Feeds",
  "Inventory & Warehouse Schema",
];

export default function CreateAgentSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
  const CreateAgentMutation = useMutation(api.agent.CreateAgent);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(false);

  const { userDetails } = useContext(UserDetailContext);
  const router = useRouter();
  const { has } = useAuth();

  // Tier detection (supports both Clerk session plan and Convex subscription)
  const hasAiPlan = Boolean(
    (has &&
      (has({ plan: "ai_architect_pro" }) ||
        has({ plan: "ai_unlimited_plan" }) ||
        has({ plan: "unlimited_plan" }))) ||
      userDetails?.subscription === "ai"
  );
  const hasProPlan = Boolean(
    (has && (has({ plan: "pro_architect" }) || has({ plan: "pro_plan" }))) ||
      userDetails?.subscription === "active" ||
      userDetails?.subscription === "pro"
  );
  const isFreePlan = !hasAiPlan && !hasProPlan;

  // Project quota check
  const userAgents = useQuery(
    api.agent.GetUserAgents,
    userDetails?._id ? { userId: userDetails._id } : "skip"
  );
  const projectCount = userAgents ? userAgents.length : 0;
  const isFreeLimitReached = isFreePlan && projectCount >= 1;
  const isProLimitReached = hasProPlan && !hasAiPlan && projectCount >= 15;
  const isLimitReached = isFreeLimitReached || isProLimitReached;

  const handleOpenCreate = () => {
    if (isLimitReached) {
      setOpenUpgradeDialog(true);
    } else {
      setOpenDialog(true);
    }
  };

  const CreateAgent = async (nameToUse?: string) => {
    const finalName = nameToUse || agentName;
    if (!finalName.trim()) {
      toast.error("Please provide a database schema name");
      return;
    }

    if (isLimitReached) {
      setOpenDialog(false);
      setOpenUpgradeDialog(true);
      toast.error(
        isFreePlan
          ? "Free plan is limited to 1 database project. Please upgrade to create more."
          : "Pro plan limit (15 projects) reached. Upgrade to AI Architect for unlimited projects."
      );
      return;
    }

    try {
      setLoading(true);
      const agentId = uuidv4();
      await CreateAgentMutation({
        agentId: agentId,
        name: finalName,
        userId: userDetails?._id,
      });
      setOpenDialog(false);
      setLoading(false);
      toast.success("Database schema canvas created!");
      router.push(`/agent-builder/${agentId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Failed to create database schema project");
    }
  };

  return (
    <div className="w-full border-b border-border bg-muted/20 px-6 py-10 md:px-12 lg:px-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 text-xs font-mono">
              Database Schema Studio
            </Badge>

            {/* Plan Quota Badge */}
            <Badge
              variant="outline"
              className={`text-xs font-mono font-medium ${
                hasAiPlan
                  ? "border-[#ffdf27]/40 text-[#ffee72] bg-[#ffdf27]/10"
                  : hasProPlan
                  ? "border-sky-500/30 text-sky-400 bg-sky-500/10"
                  : isFreeLimitReached
                  ? "border-amber-500/40 text-amber-300 bg-amber-500/15"
                  : "border-zinc-700 text-zinc-400 bg-zinc-900/50"
              }`}
            >
              {hasAiPlan
                ? "AI Architect (Unlimited Projects)"
                : hasProPlan
                ? `Pro Plan (${projectCount} / 15 Projects)`
                : `Free Plan (${projectCount} / 1 Project)`}
            </Badge>

            {isFreePlan && (
              <Link href="/dashboard/pricing">
                <Badge className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono cursor-pointer transition-colors flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Upgrade Plan</span>
                </Badge>
              </Link>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Database Schema & ER Studio
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Design relational PostgreSQL & MySQL schemas, column-to-column foreign keys, indexes, and export executable SQL DDL.
          </p>
        </div>

        {/* Action Button & Modal */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={handleOpenCreate}
            className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-md hover:shadow-[#ffc507]/20 border-none transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 text-zinc-950" />
            <span>Create New Database Schema</span>
          </Button>

          {/* Regular Create Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Workflow className="h-5 w-5 text-[#ffdf27]" />
                  <span>Create New Database Schema</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Give your database schema a project name, or pick a suggested production pattern.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Database Schema Name
                  </label>
                  <Input
                    placeholder="e.g. E-Commerce PostgreSQL Schema"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") CreateAgent();
                    }}
                    autoFocus
                  />
                </div>

                {/* Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Quick Schema Suggestions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTemplates.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => {
                          setAgentName(template);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer text-left"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <Button
                  size="sm"
                  onClick={() => CreateAgent()}
                  disabled={loading || !agentName.trim()}
                  className="bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none font-semibold cursor-pointer shadow-xs"
                >
                  {loading && <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Open Schema Canvas
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Limit Reached Upgrade Modal */}
          <Dialog open={openUpgradeDialog} onOpenChange={setOpenUpgradeDialog}>
            <DialogContent className="sm:max-w-lg border-2 border-amber-500/40 bg-[#0c0d12]/95 backdrop-blur-xl">
              <DialogHeader className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4" />
                  <span>Project Limit Reached ({projectCount} / {isFreePlan ? "1" : "15"} Projects)</span>
                </div>
                <DialogTitle className="text-xl font-bold text-white">
                  {isFreePlan
                    ? "Free Plan Limit: 1 Project"
                    : "Pro Plan Limit: 15 Projects"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
                  {isFreePlan
                    ? "The Free plan allows you to actively design and export 1 database schema project. Upgrade your plan to unlock more project slots, advanced database entities, or generative AI schema copilots."
                    : "You have reached the maximum 15 project limit on the Pro plan. Upgrade to the AI Architect tier to unlock unlimited projects."}
                </DialogDescription>
              </DialogHeader>

              {/* Upgrade Tier Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
                {/* Pro Tier Card */}
                {isFreePlan && (
                  <div className="p-4 rounded-xl border border-border bg-card/80 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-sky-400">Pro Architect</span>
                        <span className="text-xs font-mono font-bold text-white">$19/mo</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Up to 15 projects, Views, Triggers, CASCADE drops, and Prisma export.
                      </p>
                    </div>
                    <Link href="/dashboard/pricing" onClick={() => setOpenUpgradeDialog(false)}>
                      <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8 cursor-pointer">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                )}

                {/* AI Architect Tier Card */}
                <div className="p-4 rounded-xl border-2 border-[#ffdf27] bg-[#0c0d12] space-y-3 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ffdf27] text-zinc-950 text-[9px] font-mono px-2 py-0.5 rounded-bl font-bold">
                    RECOMMENDED
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-[#ffdf27] flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        AI Architect
                      </span>
                      <span className="text-xs font-mono font-bold text-white">$49/mo</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      Unlimited projects + AI Prompt-to-Schema generator & Live Agent Chat.
                    </p>
                  </div>
                  <Link href="/dashboard/pricing" onClick={() => setOpenUpgradeDialog(false)}>
                    <Button size="sm" className="w-full text-xs font-bold h-8 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none cursor-pointer">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Get AI Plan
                    </Button>
                  </Link>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white">
                    Close & Manage Existing Project
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}