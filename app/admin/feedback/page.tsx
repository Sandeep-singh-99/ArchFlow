"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MessageSquareHeart,
  Star,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  MessageCircle,
  ThumbsUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  Mail,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  bug: { label: "Bug Report", icon: Bug, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  feature_request: { label: "Feature Idea", icon: Lightbulb, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  ui_ux: { label: "UI / UX", icon: Palette, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  performance: { label: "Speed", icon: Zap, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  general: { label: "General", icon: MessageCircle, color: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
  praise: { label: "Praise", icon: ThumbsUp, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
};

export default function AdminFeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const feedbacks = useQuery(api.admin.GetAllFeedback, {
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
    typeFilter: typeFilter === "all" ? undefined : typeFilter,
    tierFilter: tierFilter === "all" ? undefined : tierFilter,
  });

  const updateStatus = useMutation(api.admin.UpdateFeedbackStatus);
  const deleteFeedback = useMutation(api.admin.DeleteFeedback);

  const filteredFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    if (!searchQuery.trim()) return feedbacks;

    const q = searchQuery.toLowerCase();
    return feedbacks.filter(
      (f) =>
        f.message.toLowerCase().includes(q) ||
        (f.title && f.title.toLowerCase().includes(q)) ||
        f.userName.toLowerCase().includes(q) ||
        f.userEmail.toLowerCase().includes(q)
    );
  }, [feedbacks, searchQuery]);

  const handleStatusChange = async (feedbackId: any, nextStatus: string) => {
    try {
      await updateStatus({ feedbackId, status: nextStatus });
      toast.success(`Feedback status changed to ${nextStatus.replace("_", " ")}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDelete = async (feedbackId: any) => {
    try {
      await deleteFeedback({ feedbackId });
      toast.success("Feedback deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete feedback");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-pink-400" />
            <span>User Feedback & Bug Inbox</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Review user ratings, feature requests, bug reports, and prioritize feedback by user subscription tier.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs py-1 px-3 w-fit">
          {filteredFeedbacks.length} reviews found
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border bg-card/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback message, user, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("new")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "new" ? "bg-card text-rose-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("in_review")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "in_review" ? "bg-card text-amber-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                In Review
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "resolved" ? "bg-card text-emerald-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Secondary Filter Row: Category & User Tier */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/60 text-xs">
            {/* User Tier filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">User Plan:</span>
              <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setTierFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    tierFilter === "all" ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter("ai")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    tierFilter === "ai" ? "bg-card text-primary font-semibold" : "text-muted-foreground"
                  }`}
                >
                  AI ($49)
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter("pro")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    tierFilter === "pro" ? "bg-card text-emerald-400 font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Pro ($19)
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter("free")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    tierFilter === "free" ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Free
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Category:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
                    className={`px-2 py-0.5 rounded-md text-[11px] border transition-colors ${
                      typeFilter === key
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Feed */}
      <div className="space-y-4">
        {!feedbacks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <Card className="border-border bg-card/40 p-8 text-center space-y-2">
            <MessageSquareHeart className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-semibold">No feedback entries found</h3>
            <p className="text-xs text-muted-foreground">
              No reviews match the selected filters or search terms.
            </p>
          </Card>
        ) : (
          filteredFeedbacks.map((f) => {
            const cat = CATEGORY_MAP[f.type] || CATEGORY_MAP.general;
            const Icon = cat.icon;
            const dateStr = new Date(f.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Card
                key={String(f._id)}
                className={`border-border bg-card/60 backdrop-blur-sm transition-all hover:border-primary/40 ${
                  f.status === "new" ? "border-l-4 border-l-rose-500" : ""
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Top line: Category, Rating, User Tier, Status, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-mono flex items-center gap-1 ${cat.color}`}>
                        <Icon className="h-3 w-3" />
                        <span>{cat.label}</span>
                      </Badge>

                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          f.userTier === "ai"
                            ? "border-primary/40 text-primary bg-primary/10"
                            : f.userTier === "pro"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {f.userTier === "ai" ? "AI Unlimited" : f.userTier === "pro" ? "Pro Plan" : "Free Plan"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono capitalize ${
                          f.status === "new"
                            ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            : f.status === "in_review"
                            ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        }`}
                      >
                        {f.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                    </div>
                  </div>

                  {/* Title & Message */}
                  <div className="space-y-1">
                    {f.title && <h3 className="text-sm font-bold text-foreground">{f.title}</h3>}
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {f.message}
                    </p>
                  </div>

                  {/* Submitter & Actions Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-primary">
                        {f.userName.charAt(0) || "U"}
                      </div>
                      <span className="font-medium text-foreground">{f.userName}</span>
                      <span className="text-muted-foreground/70">({f.userEmail})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <a href={`mailto:${f.userEmail}?subject=Regarding your ArchFlow feedback`}>
                          <Mail className="h-3 w-3" />
                          <span>Reply</span>
                        </a>
                      </Button>

                      {f.status !== "in_review" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(f._id, "in_review")}
                          className="h-7 text-[11px] gap-1 text-amber-400 hover:text-amber-300"
                        >
                          <Clock className="h-3 w-3" />
                          <span>In Review</span>
                        </Button>
                      )}

                      {f.status !== "resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(f._id, "resolved")}
                          className="h-7 text-[11px] gap-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Resolve</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(f._id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
