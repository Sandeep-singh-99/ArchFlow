"use client";

import { Button } from "@/components/ui/button";
import {
  Loader,
  Plus,
  Workflow,
  Sparkles,
  Zap,
  Lock,
  AlertCircle,
  Database,
  Boxes,
} from "lucide-react";
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

export default function CreateAgentSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
  const CreateAgentMutation = useMutation(api.agent.CreateAgent);
  const [agentName, setAgentName] = useState("");
  const [schemaType, setSchemaType] = useState<"sql" | "nosql">("sql");
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
        schemaType: schemaType,
        userId: userDetails?._id,
      });
      setOpenDialog(false);
      setLoading(false);
      toast.success(
        schemaType === "nosql"
          ? "NoSQL database schema canvas created!"
          : "SQL relational schema canvas created!"
      );
      router.push(`/agent-builder/${agentId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Failed to create database schema project");
    }
  };

  return (
    <div className="relative border-b border-border/80 bg-gradient-to-b from-card/60 via-card/20 to-transparent px-6 py-6 md:px-12 lg:px-20">
      {/* Background radial accent glow */}
      <div className="absolute top-0 right-1/4 -z-10 h-48 w-96 rounded-full bg-[#ffc507]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Heading, Badges & Templates */}
        <div className="space-y-3.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 text-xs font-mono py-0.5 px-2.5"
            >
              Schema Studio v2.0
            </Badge>

            {/* Plan Quota Badge */}
            <Badge
              variant="outline"
              className={`text-xs font-mono font-medium py-0.5 px-2.5 ${
                hasAiPlan
                  ? "border-[#ffdf27]/40 text-[#ffee72] bg-[#ffdf27]/10"
                  : hasProPlan
                  ? "border-sky-500/30 text-sky-400 bg-sky-500/10"
                  : isFreeLimitReached
                  ? "border-amber-500/40 text-amber-300 bg-amber-500/15"
                  : "border-border text-muted-foreground bg-muted/30"
              }`}
            >
              {hasAiPlan
                ? "AI Architect (Unlimited)"
                : hasProPlan
                ? `Pro Plan (${projectCount} / 15 Schemas)`
                : `Free Plan (${projectCount} / 1 Schema)`}
            </Badge>

            {isFreePlan && (
              <Link href="/dashboard/pricing">
                <Badge className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono cursor-pointer transition-colors flex items-center gap-1 py-0.5">
                  <Lock className="h-3 w-3" />
                  <span>Upgrade to Pro</span>
                </Badge>
              </Link>
            )}
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Design & Orchestrate Production Schemas
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Interactive entity-relationship modeling for SQL (PostgreSQL, MySQL)
              and NoSQL (MongoDB, Document Stores). Visual tables, collections, foreign keys, and instant export.
            </p>
          </div>
        </div>

        {/* Right Column: Primary CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="lg"
            onClick={handleOpenCreate}
            className="gap-2.5 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 hover:shadow-lg hover:shadow-[#ffc507]/20 border-none transition-all shadow-sm cursor-pointer h-11 px-5"
          >
            <Plus className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
            <span>Create New Schema</span>
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
                  Give your database schema a project name and choose its architecture.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-1">
                {/* Schema Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Database Schema Name
                  </label>
                  <Input
                    placeholder={
                      schemaType === "sql"
                        ? "e.g. E-Commerce PostgreSQL Schema"
                        : "e.g. Social Media MongoDB Cluster"
                    }
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") CreateAgent();
                    }}
                    autoFocus
                  />
                </div>

                {/* Project Architecture: SQL vs NoSQL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Architecture Type
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Helps filter & tag projects
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* SQL Option */}
                    <button
                      type="button"
                      onClick={() => setSchemaType("sql")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                        schemaType === "sql"
                          ? "border-[#ffdf27] bg-[#ffc507]/10 ring-2 ring-[#ffdf27]/30 shadow-xs"
                          : "border-border/80 bg-card/60 hover:border-zinc-600 hover:bg-card/90"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            schemaType === "sql"
                              ? "bg-[#ffdf27]/20 text-[#ffee72]"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Database className="h-4 w-4" />
                        </div>
                        {schemaType === "sql" && (
                          <Badge className="bg-[#ffdf27] text-zinc-950 text-[9px] px-1.5 py-0 font-bold font-mono">
                            SELECTED
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground font-mono">
                          SQL (Relational)
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          Postgres, MySQL, tables, views, triggers & FK links
                        </p>
                      </div>
                    </button>

                    {/* NoSQL Option */}
                    <button
                      type="button"
                      onClick={() => setSchemaType("nosql")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                        schemaType === "nosql"
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-xs"
                          : "border-border/80 bg-card/60 hover:border-zinc-600 hover:bg-card/90"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            schemaType === "nosql"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Boxes className="h-4 w-4" />
                        </div>
                        {schemaType === "nosql" && (
                          <Badge className="bg-emerald-500 text-zinc-950 text-[9px] px-1.5 py-0 font-bold font-mono">
                            SELECTED
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground font-mono">
                          NoSQL (Document)
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          MongoDB, collections, embedded sub-docs & JSON
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  size="sm"
                  onClick={() => CreateAgent()}
                  disabled={loading || !agentName.trim()}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none font-semibold cursor-pointer shadow-xs"
                >
                  {loading && (
                    <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
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
                  <span>
                    Project Limit Reached ({projectCount} /{" "}
                    {isFreePlan ? "1" : "15"} Projects)
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-white">
                  {isFreePlan
                    ? "Free Plan Limit: 1 Project"
                    : "Pro Plan Limit: 15 Projects"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
                  {isFreePlan
                    ? "The Free plan allows you to design and export 1 database schema project. Upgrade your plan to unlock more project slots, advanced database entities, and generative AI schema copilots."
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
                        <span className="text-xs font-bold font-mono text-sky-400">
                          Pro Architect
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          $19/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Up to 15 projects, Views, Triggers, CASCADE drops, and
                        Prisma export.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/pricing"
                      onClick={() => setOpenUpgradeDialog(false)}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold h-8 cursor-pointer"
                      >
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
                      <span className="text-xs font-mono font-bold text-white">
                        $49/mo
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      Unlimited projects + AI Prompt-to-Schema generator & Live
                      Agent Chat.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/pricing"
                    onClick={() => setOpenUpgradeDialog(false)}
                  >
                    <Button
                      size="sm"
                      className="w-full text-xs font-bold h-8 bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Get AI Plan
                    </Button>
                  </Link>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-400 hover:text-white"
                  >
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
