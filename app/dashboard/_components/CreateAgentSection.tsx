"use client";

import { Button } from "@/components/ui/button";
import {
  Loader,
  Plus,
  Workflow,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Database,
  Boxes,
} from "lucide-react";
import React, { useContext, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getUserPlanCode, getPlanProjectQuota, PLAN_NAMES } from "@/lib/planAccess";
import PlanUpgradeModal from "@/components/plans/PlanUpgradeModal";

import MyAgents from "@/app/dashboard/_components/MyAgents";

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

  // Unified tier detection & project quota
  const activePlans = useQuery(api.plans.GetActivePlans, {});
  const userPlan = getUserPlanCode(userDetails, has);
  const isFreePlan = userPlan === "free";

  // Project quota check
  const userAgents = useQuery(
    api.agent.GetUserAgentsList,
    userDetails?._id ? { userId: userDetails._id, includeSchemaStats: true } : "skip"
  );
  const projectCount = userAgents ? userAgents.length : 0;
  const quota = getPlanProjectQuota(userPlan, activePlans, userDetails?.subscriptionPlanId);
  const isUnlimited = quota >= 999;
  const isLimitReached = projectCount >= quota;

  const handleOpenCreate = () => {
    if (isLimitReached) {
      setOpenUpgradeDialog(true);
    } else {
      setOpenDialog(true);
    }
  };

  const CreateAgent = async () => {
    if (loading || !userDetails?._id) return;
    const finalName = agentName.trim();
    if (!finalName) {
      toast.error("Please provide a database schema name");
      return;
    }

    if (isLimitReached) {
      setOpenDialog(false);
      setOpenUpgradeDialog(true);
      toast.error(
        isFreePlan
          ? `Free plan is limited to ${quota} database project. Please upgrade to create more.`
          : `Plan limit (${quota} projects) reached. Please upgrade to unlock more database project slots.`
      );
      return;
    }

    try {
      setLoading(true);
      const agentId = crypto.randomUUID();
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
    <main className="mx-auto w-full max-w-[90rem] space-y-6 px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <header className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#101017] px-5 py-7 sm:px-8 sm:py-9">
          {/* Background radial accent glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_right_top,#373051,transparent_70%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-2/5 bg-[radial-gradient(#c8b9f24a_1px,transparent_1px)] bg-size-[16px_16px] mask-[linear-gradient(90deg,transparent,black_35%)] md:block">
            <div className="absolute top-1/2 right-5 flex -translate-y-1/2 items-center lg:right-8">
              <div className="grid size-15 place-items-center rounded-2xl border border-violet-300/30 bg-[#1c192b] text-violet-200 shadow-lg shadow-black/25 lg:size-18">
                <Database className="size-6" />
              </div>
              <div className="w-7 border-t border-dashed border-violet-300/55 lg:w-10" />
              <div className="flex h-28 flex-col justify-between border-l border-violet-300/35">
                <div className="grid size-10 -translate-y-1/2 place-items-center rounded-xl border border-violet-300/25 bg-[#1c192b] text-violet-200"><Workflow className="size-4" /></div>
                <div className="grid size-10 translate-y-1/2 place-items-center rounded-xl border border-emerald-300/25 bg-[#172526] text-emerald-200"><Boxes className="size-4" /></div>
              </div>
            </div>
          </div>

          {/* Workspace heading and entry points */}
          <div className="relative max-w-lg md:w-2/3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">Database workspace</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Design SQL and NoSQL schemas, map relationships, and open your projects in the visual canvas.
            </p>

            {/* Primary schema creation action */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button onClick={handleOpenCreate} disabled={!userAgents} className="h-10 cursor-pointer bg-[#ffe47a] px-4 font-semibold text-zinc-950 hover:bg-[#ffed9d]">
                <Plus aria-hidden />
                New schema
              </Button>
              <Button asChild variant="outline" className="h-10 border-white/15 bg-white/5 px-4 hover:bg-white/10">
                <Link href="/dashboard/analytics"><BarChart3 aria-hidden /> Share analytics</Link>
              </Button>
            </div>
          </div>
        </header>

        <section aria-labelledby="workspace-plan" className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><CreditCard aria-hidden className="size-4" /></span>
            <div>
              <h2 id="workspace-plan" className="text-xs font-medium text-muted-foreground">Workspace plan</h2>
              <p className="text-sm font-semibold">{PLAN_NAMES[userPlan]}</p>
            </div>
          </div>

          {/* Current plan quota */}
          <div className="mt-5">
            {userAgents ? (
              <>
                <p className="text-sm font-medium tabular-nums">
                  {isUnlimited ? `${projectCount} schemas · Unlimited` : `${projectCount} of ${quota} schema slots used`}
                </p>
                {!isUnlimited && (
                  <div role="progressbar" aria-label="Schema slots used" aria-valuenow={Math.min(projectCount, quota)} aria-valuemax={quota} className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[#ffe47a]" style={{ width: `${Math.min((projectCount / quota) * 100, 100)}%` }} />
                  </div>
                )}
              </>
            ) : <p className="text-sm text-muted-foreground">Loading schema usage…</p>}
          </div>

          <Button asChild variant="outline" className="mt-5 w-fit xl:mt-auto">
            <Link href="/dashboard/pricing">{isFreePlan ? "Explore plans" : "Manage plan"} <ArrowUpRight aria-hidden /></Link>
          </Button>
        </section>
      </div>

      <MyAgents agents={userAgents} userId={userDetails?._id} onOpenCreateDialog={handleOpenCreate} />
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
              <label htmlFor="schema-name" className="text-xs font-medium text-foreground">
                Database Schema Name
              </label>
              <Input
                id="schema-name"
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
                  aria-pressed={schemaType === "sql"}
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
                  aria-pressed={schemaType === "nosql"}
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

      {/* Plan Quota Upgrade Modal */}
      <PlanUpgradeModal
        open={openUpgradeDialog}
        onOpenChange={setOpenUpgradeDialog}
        isQuotaModal={true}
        currentPlan={userPlan}
        projectCount={projectCount}
        projectQuota={quota}
      />
    </main>
  );
}
