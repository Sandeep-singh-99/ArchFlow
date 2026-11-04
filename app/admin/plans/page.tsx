"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  CreditCard,
  Check,
  X,
  Database,
  Coins,
  Tag,
  RefreshCw,
  Power,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PlanFormData {
  id?: Id<"PlanTable">;
  name: string;
  planCode: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  validityDays: number;
  expiryDate: string;
  features: string[];
  badge: string;
  tokenQuota: number;
  projectQuota: number;
  isUnlimitedProjects: boolean;
  isActive: boolean;
}

/** Canonical 7 features that map 1-to-1 with the Detailed Plan Comparison table */
const COMPARISON_FEATURES: { label: string; ai?: boolean }[] = [
  { label: "React Flow Visual Canvas" },
  { label: "PostgreSQL & MySQL DDL Export" },
  { label: "Multi-Domain Grouping" },
  { label: "CASCADE Drop Simulator" },
  { label: "Prisma ORM & SQLite Export" },
  { label: "AI Prompt-to-Schema Copilot", ai: true },
  { label: "AI Agent Chat & Tool Execution", ai: true },
];

const DEFAULT_FORM: PlanFormData = {
  name: "",
  planCode: "",
  description: "",
  monthlyPrice: 999,
  yearlyPrice: 9999,
  currency: "INR",
  validityDays: 30,
  expiryDate: "",
  features: [
    "React Flow Visual Canvas",
    "PostgreSQL & MySQL DDL Export",
    "Multi-Domain Grouping",
    "CASCADE Drop Simulator",
    "Prisma ORM & SQLite Export",
  ],
  badge: "",
  tokenQuota: 50000,
  projectQuota: 15,
  isUnlimitedProjects: false,
  isActive: true,
};

export default function AdminPlansPage() {
  const plans = useQuery(api.plans.GetAllPlans, {});
  const createPlan = useMutation(api.plans.CreatePlan);
  const updatePlan = useMutation(api.plans.UpdatePlan);
  const deletePlan = useMutation(api.plans.DeletePlan);
  const togglePlanStatus = useMutation(api.plans.TogglePlanStatus);
  const seedDefaultPlans = useMutation(api.plans.SeedDefaultPlans);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<Id<"PlanTable"> | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Open modal for new plan
  const handleOpenCreateDialog = () => {
    setEditingPlanId(null);
    setFormData(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  // Open modal for editing existing plan
  const handleOpenEditDialog = (plan: (typeof plans extends (infer U)[] | undefined ? U : never)) => {
    if (!plan) return;
    const isUnlimited = (plan.projectQuota ?? 1) >= 999 || (plan.projectQuota ?? 1) === 0 || plan.planCode === "ai";
    setEditingPlanId(plan._id);
    setFormData({
      id: plan._id,
      name: plan.name,
      planCode: plan.planCode,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency || "INR",
      validityDays: plan.validityDays || 30,
      expiryDate: plan.expiryDate || "",
      features: plan.features.filter((f) =>
        COMPARISON_FEATURES.some(
          (c) =>
            f.toLowerCase().includes(c.label.toLowerCase()) ||
            c.label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase())
        )
      ),
      badge: plan.badge || "",
      tokenQuota: plan.tokenQuota || 50000,
      projectQuota: isUnlimited ? 9999 : (plan.projectQuota || 15),
      isUnlimitedProjects: isUnlimited,
      isActive: plan.isActive,
    });
    setIsDialogOpen(true);
  };

  // Submit Plan Form
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a plan name");
      return;
    }
    if (!formData.planCode.trim()) {
      toast.error("Please enter a plan code (e.g. 'pro', 'ai')");
      return;
    }
    if (formData.features.length === 0) {
      toast.error("Please add at least one feature");
      return;
    }

    try {
      setIsSubmitting(true);
      const finalProjectQuota = formData.isUnlimitedProjects ? 9999 : Math.max(1, Number(formData.projectQuota));
      // Only keep canonical comparison features
      const cleanFeatures = formData.features.filter((f) =>
        COMPARISON_FEATURES.some(
          (c) =>
            f.toLowerCase().includes(c.label.toLowerCase()) ||
            c.label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase())
        )
      );

      if (editingPlanId) {
        await updatePlan({
          id: editingPlanId,
          name: formData.name,
          planCode: formData.planCode,
          description: formData.description,
          monthlyPrice: Number(formData.monthlyPrice),
          yearlyPrice: Number(formData.yearlyPrice),
          currency: formData.currency,
          validityDays: Number(formData.validityDays),
          expiryDate: formData.expiryDate.trim() || undefined,
          features: cleanFeatures,
          badge: formData.badge.trim() || undefined,
          tokenQuota: Number(formData.tokenQuota),
          projectQuota: finalProjectQuota,
          isActive: formData.isActive,
        });
        toast.success(`Plan "${formData.name}" updated successfully!`);
      } else {
        await createPlan({
          name: formData.name,
          planCode: formData.planCode,
          description: formData.description,
          monthlyPrice: Number(formData.monthlyPrice),
          yearlyPrice: Number(formData.yearlyPrice),
          currency: formData.currency,
          validityDays: Number(formData.validityDays),
          expiryDate: formData.expiryDate.trim() || undefined,
          features: cleanFeatures,
          badge: formData.badge.trim() || undefined,
          tokenQuota: Number(formData.tokenQuota),
          projectQuota: finalProjectQuota,
          isActive: formData.isActive,
        });
        toast.success(`Plan "${formData.name}" created successfully!`);
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save plan";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: Id<"PlanTable">, currentStatus: boolean) => {
    try {
      await togglePlanStatus({ id });
      toast.success(currentStatus ? "Plan deactivated" : "Plan activated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle status";
      toast.error(msg);
    }
  };

  // Delete plan
  const handleDeletePlan = async (id: Id<"PlanTable">, name: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${name}"?`)) return;
    try {
      await deletePlan({ id });
      toast.success(`Plan "${name}" removed`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete plan";
      toast.error(msg);
    }
  };

  // Seed default tiers
  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDefaultPlans({});
      if (res.count) {
        toast.success(`Seeded ${res.count} default plans successfully!`);
      } else {
        toast.info(res.message || "Default plans already present");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed default plans";
      toast.error(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!plans) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const activePlansCount = plans.filter((p) => p.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-amber-400" />
            <span>Subscription Plans & Razorpay Pricing</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create, customize, and configure subscription plans, validity periods, expiry deadlines, and features for customer checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="text-xs font-medium border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            title="Update or reset default tiers (Free, Pro, AI) with latest features and unlimited projects"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSeeding ? "animate-spin" : ""}`} />
            {plans.length === 0 ? "Seed Defaults" : "Sync Default Tiers"}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateDialog}
            className="text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase font-mono">Total Plans</p>
              <p className="text-2xl font-bold font-mono">{plans.length}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase font-mono">Active Plans</p>
              <p className="text-2xl font-bold font-mono text-emerald-400">{activePlansCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase font-mono">Payment Gateway</p>
              <p className="text-sm font-bold text-sky-400 flex items-center gap-1.5 mt-1">
                <CreditCard className="h-4 w-4" /> Razorpay
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase font-mono">Currency</p>
              <p className="text-2xl font-bold font-mono text-amber-400">INR (₹)</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans List Cards */}
      {plans.length === 0 ? (
        <Card className="border-border border-dashed bg-card/30 p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No Subscription Plans Created Yet</h3>
            <p className="text-xs text-muted-foreground">
              Configure your first plan with name, monthly & yearly pricing, validity duration, and features, or seed the recommended default tiers.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Seed Default Tiers
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreateDialog}
                className="text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Custom Plan
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`flex flex-col border transition-all duration-200 rounded-2xl ${
                plan.isActive
                  ? "border-border bg-card/90 shadow-md hover:border-amber-400/40"
                  : "border-border/40 bg-card/30 opacity-70"
              }`}
            >
              {/* Card Header */}
              <CardHeader className="space-y-2 pb-4 border-b border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    {plan.badge && (
                      <Badge className="text-[10px] uppercase font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono capitalize ${
                      plan.isActive
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-zinc-700 text-zinc-500 bg-zinc-800/20"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                  {plan.description || "No description provided."}
                </CardDescription>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted/60 border border-border">
                    code: {plan.planCode}
                  </span>
                  {plan.expiryDate && (
                    <span className="flex items-center gap-1 text-amber-400/90">
                      <Calendar className="h-3 w-3" />
                      Exp: {plan.expiryDate}
                    </span>
                  )}
                </div>
              </CardHeader>

              {/* Pricing & Validity Section */}
              <CardContent className="flex-1 space-y-4 pt-4 text-xs">
                {/* Price Display */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Monthly:</span>
                    <span className="text-lg font-extrabold font-mono text-foreground">
                      ₹{plan.monthlyPrice.toLocaleString()}{" "}
                      <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Yearly:</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      ₹{plan.yearlyPrice.toLocaleString()}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">/yr</span>
                    </span>
                  </div>
                </div>

                {/* Quotas & Validity */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span>{plan.validityDays} Days Validity</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-foreground">
                      {plan.projectQuota >= 999 || plan.projectQuota === 0 || plan.planCode === "ai"
                        ? "Unlimited Projects"
                        : plan.projectQuota === 1
                        ? "1 Project"
                        : `${plan.projectQuota} Projects`}
                    </span>
                  </div>
                </div>

                {/* Features List — Canonical 7 comparison features only */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider font-mono">
                      Features ({plan.features.filter((f) => COMPARISON_FEATURES.some((c) => f.toLowerCase().includes(c.label.toLowerCase()) || c.label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase()))).length}/7)
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Plan Comparison
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {COMPARISON_FEATURES.map(({ label, ai }) => {
                      const included = plan.features.some(
                        (f) =>
                          f.toLowerCase().includes(label.toLowerCase()) ||
                          label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase())
                      );
                      return (
                        <li
                          key={label}
                          className={`flex items-start gap-2 text-[11px] ${
                            included ? "text-foreground/90" : "text-zinc-500"
                          }`}
                        >
                          {included ? (
                            ai ? (
                              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            )
                          ) : (
                            <X className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`leading-tight ${!included ? "line-through opacity-60" : ""} ${
                              included && ai ? "font-medium text-amber-300" : ""
                            }`}
                          >
                            {label}
                            {included && ai && (
                              <span className="ml-1 text-[9px] font-mono text-amber-400/80">(Full Access)</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>

              {/* Action Buttons Footer */}
              <CardFooter className="pt-3 pb-4 border-t border-border/40 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                  className={`text-xs h-8 px-2.5 ${
                    plan.isActive
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  <Power className="h-3.5 w-3.5 mr-1" />
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(plan)}
                    className="h-8 px-2.5 text-xs hover:border-amber-400/50"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1 text-amber-400" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlan(plan._id, plan.name)}
                    className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE & EDIT PLAN DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 bg-card border-border/80 rounded-2xl shadow-2xl">
          {/* Fixed Dialog Header */}
          <DialogHeader className="p-5 sm:p-6 px-6 sm:px-8 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-base sm:text-xl font-bold text-foreground">
                    {editingPlanId ? "Edit Subscription Plan" : "Create New Subscription Plan"}
                  </DialogTitle>
                  {formData.badge && (
                    <Badge className="text-[10px] uppercase font-mono font-bold bg-amber-500/15 text-amber-300 border-amber-500/30 px-2.5 py-0.5">
                      {formData.badge}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Configure plan identity, pricing tiers, quotas, validity terms, and canonical comparison features.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <form id="planForm" onSubmit={handleSubmitPlan} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* SECTION 1: Identity & Branding */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                <span>Plan Identity & Branding</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60">
                {/* Plan Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="planName" className="text-xs font-medium text-foreground">
                    Plan Name *
                  </Label>
                  <Input
                    id="planName"
                    placeholder="e.g. Pro Architect"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        planCode:
                          !editingPlanId &&
                          (!prev.planCode || prev.planCode === prev.name.toLowerCase().replace(/\s+/g, "_"))
                            ? name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 20)
                            : prev.planCode,
                      }));
                    }}
                    className="text-xs"
                    required
                  />
                </div>

                {/* Plan Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="planCode" className="text-xs font-medium text-foreground">
                    Plan Code (Slug) *
                  </Label>
                  <Input
                    id="planCode"
                    placeholder="e.g. pro, ai"
                    value={formData.planCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planCode: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    className="text-xs font-mono"
                    required
                  />
                </div>

                {/* Badge Tag */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="badge" className="text-xs font-medium text-foreground">
                      Badge (Optional)
                    </Label>
                    <div className="flex gap-1">
                      {["POPULAR", "ULTIMATE"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setFormData({ ...formData, badge: formData.badge === b ? "" : b })}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition-colors cursor-pointer ${
                            formData.badge === b
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                              : "bg-muted text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="badge"
                    placeholder="e.g. POPULAR, BEST VALUE"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value.toUpperCase() })}
                    className="text-xs uppercase font-mono"
                  />
                </div>

                {/* Plan Description */}
                <div className="sm:col-span-3 space-y-1.5 pt-1 border-t border-border/40">
                  <Label htmlFor="planDescription" className="text-xs font-medium text-foreground">
                    Plan Description
                  </Label>
                  <Textarea
                    id="planDescription"
                    placeholder="Brief summary of who this plan is designed for and key capabilities it unlocks..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="text-xs min-h-[56px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Pricing, Currency & Validity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Pricing, Billing & Validity</span>
                </div>
                {formData.monthlyPrice > 0 && formData.yearlyPrice > 0 && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Yearly discount: ~{Math.max(0, Math.round((1 - formData.yearlyPrice / (formData.monthlyPrice * 12)) * 100))}% off
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60">
                <div className="space-y-1.5">
                  <Label htmlFor="monthlyPrice" className="text-xs font-medium text-foreground">
                    Monthly Price (₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">₹</span>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      min="0"
                      placeholder="1499"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                      className="text-xs font-mono pl-6"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="yearlyPrice" className="text-xs font-medium text-foreground">
                    Yearly Price (₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">₹</span>
                    <Input
                      id="yearlyPrice"
                      type="number"
                      min="0"
                      placeholder="14999"
                      value={formData.yearlyPrice}
                      onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                      className="text-xs font-mono pl-6"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="validityDays" className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-sky-400" /> Validity (Days) *
                  </Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3 text-amber-400" /> Currency
                  </Label>
                  <Input
                    id="currency"
                    placeholder="INR"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    className="text-xs font-mono uppercase"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 space-y-1.5 pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiryDate" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-sky-400" />
                      Fixed Promotional Sunset / Campaign Deadline (Optional)
                    </Label>
                    {formData.expiryDate && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, expiryDate: "" })}
                        className="text-[10px] text-muted-foreground hover:text-rose-400 font-mono cursor-pointer"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Quotas & Resource Capacities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Database className="h-3.5 w-3.5 text-sky-400" />
                <span>Active Projects Quota & Capacity</span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60">
                {/* Active Projects Quota */}
                <div className="space-y-3 p-3.5 rounded-lg bg-card/60 border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Active Projects Quota
                    </Label>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isUnlimitedProjects}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            isUnlimitedProjects: checked,
                            projectQuota: checked ? 9999 : prev.projectQuota >= 999 ? 15 : prev.projectQuota,
                          }));
                        }}
                        className="rounded border-border accent-amber-400 cursor-pointer"
                      />
                      <span>Unlimited Projects</span>
                    </label>
                  </div>

                  {formData.isUnlimitedProjects ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        Unlimited Projects
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40">
                        No Limit Cap
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="1"
                          placeholder="15"
                          value={formData.projectQuota}
                          onChange={(e) => setFormData({ ...formData, projectQuota: Number(e.target.value) })}
                          className="text-xs font-mono max-w-xs"
                        />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">Projects</span>
                      </div>
                      <div className="flex gap-1.5 pt-0.5">
                        {[1, 5, 10, 15, 25].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setFormData({ ...formData, projectQuota: q, isUnlimitedProjects: false })}
                            className={`text-[10px] px-2.5 py-0.5 rounded font-mono border transition-colors cursor-pointer ${
                              formData.projectQuota === q && !formData.isUnlimitedProjects
                                ? "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold"
                                : "bg-muted text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {formData.isUnlimitedProjects
                      ? "Subscribers can create and save unlimited canvas projects without quota cap."
                      : "Maximum number of simultaneous active projects the subscriber can store."}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: Comparison Features (The Canonical 7) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Detailed Plan Comparison Features</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-amber-300 border-amber-500/30 bg-amber-500/10">
                  {formData.features.length} of 7 Included
                </Badge>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60 space-y-3.5">
                {/* Presets Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-card/60 border border-border/50">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" /> Quick Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: ["React Flow Visual Canvas", "PostgreSQL & MySQL DDL Export"],
                        }))
                      }
                      className="text-[11px] px-3 py-1 rounded-md border border-border bg-muted/40 hover:border-amber-400/50 hover:text-amber-300 transition-colors font-mono cursor-pointer"
                    >
                      Free Tier (2)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: [
                            "React Flow Visual Canvas",
                            "PostgreSQL & MySQL DDL Export",
                            "Multi-Domain Grouping",
                            "CASCADE Drop Simulator",
                            "Prisma ORM & SQLite Export",
                          ],
                        }))
                      }
                      className="text-[11px] px-3 py-1 rounded-md border border-border bg-muted/40 hover:border-sky-400/50 hover:text-sky-300 transition-colors font-mono cursor-pointer"
                    >
                      Pro Tier (5)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          features: [
                            "React Flow Visual Canvas",
                            "PostgreSQL & MySQL DDL Export",
                            "Multi-Domain Grouping",
                            "CASCADE Drop Simulator",
                            "Prisma ORM & SQLite Export",
                            "AI Prompt-to-Schema Copilot",
                            "AI Agent Chat & Tool Execution",
                          ],
                        }))
                      }
                      className="text-[11px] px-3 py-1 rounded-md border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 hover:brightness-110 transition-colors font-mono cursor-pointer font-bold"
                    >
                      AI Architect Tier (All 7)
                    </button>
                  </div>
                </div>

                {/* Canonical 7 Feature Toggle Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COMPARISON_FEATURES.map(({ label, ai }) => {
                    const isChecked = formData.features.some(
                      (f) =>
                        f.toLowerCase().includes(label.toLowerCase()) ||
                        label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase())
                    );
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => {
                            if (isChecked) {
                              return {
                                ...prev,
                                features: prev.features.filter(
                                  (f) =>
                                    !f.toLowerCase().includes(label.toLowerCase()) &&
                                    !label.toLowerCase().includes(f.replace(" (Full Access)", "").toLowerCase())
                                ),
                              };
                            } else {
                              return {
                                ...prev,
                                features: [...prev.features, label],
                              };
                            }
                          });
                        }}
                        className={`flex items-center justify-between p-3 px-3.5 rounded-xl border text-xs text-left transition-all duration-150 cursor-pointer ${
                          isChecked
                            ? ai
                              ? "bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-xs shadow-amber-500/10 font-semibold"
                              : "bg-emerald-500/10 border-emerald-500/50 text-emerald-200 font-medium"
                            : "bg-card/40 border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isChecked
                                ? ai
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ai ? <Sparkles className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                          </div>
                          <span className="leading-tight text-xs sm:text-sm font-medium">{label}</span>
                        </span>

                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? ai
                                ? "bg-amber-400 text-black border-amber-400 font-bold"
                                : "bg-emerald-500 text-black border-emerald-500 font-bold"
                              : "border-border/80 bg-transparent text-muted-foreground"
                          }`}
                        >
                          {isChecked ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 5: Plan Visibility Switch */}
            <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${formData.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  <Power className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="activePlanSwitch" className="text-xs sm:text-sm font-semibold cursor-pointer text-foreground">
                    Publish Plan Immediately
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    When active, this plan will be visible on user pricing cards and available for checkout.
                  </p>
                </div>
              </div>
              <Switch
                id="activePlanSwitch"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </form>

          {/* Fixed Dialog Footer with Status Summary */}
          <DialogFooter className="p-4 px-6 sm:px-8 border-t border-border/60 bg-muted/30 flex flex-row items-center justify-between gap-4">
            <div className="text-[11px] sm:text-xs font-mono text-muted-foreground hidden sm:block">
              Code: <span className="text-foreground">{formData.planCode || "—"}</span> •{" "}
              Price: <span className="text-amber-400 font-bold">₹{formData.monthlyPrice.toLocaleString()}/mo</span>
            </div>
            <div className="flex items-center gap-2.5 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="planForm"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-9 px-5 font-bold bg-amber-400 hover:bg-amber-300 text-black shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                ) : editingPlanId ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Update Plan
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Create Plan
                  </span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
