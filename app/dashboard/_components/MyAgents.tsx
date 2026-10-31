"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { Agent } from "@/types/AgentTypes";
import { useConvex, useMutation } from "convex/react";
import {
  Database,
  Plus,
  SearchX,
  RotateCcw,
} from "lucide-react";
import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SchemaCard from "./SchemaCard";
import SchemaTableView from "./SchemaTableView";
import DashboardMetricsBar from "./DashboardMetricsBar";
import DashboardToolbar, {
  FilterStatus,
  TypeFilter,
  SortOption,
  ViewMode,
} from "./DashboardToolbar";
import { useAuth } from "@clerk/nextjs";
import { getSchemaType } from "@/lib/schemaClassifier";

interface MyAgentsProps {
  onOpenCreateDialog?: () => void;
}

export default function MyAgents({ onOpenCreateDialog }: MyAgentsProps = {}) {
  const { userDetails } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const convex = useConvex();
  const deleteAgentMutation = useMutation(api.agent.DeleteAgent);
  const [deleteId, setDeleteId] = useState<Id<"AgentTable"> | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
  const [openAlert, setOpenAlert] = useState(false);

  // Search, Filter, Sort & View State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { has } = useAuth();
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
  const isPaidUser = hasAiPlan || hasProPlan;

  const GetUserAgents = useCallback(async () => {
    if (!userDetails?._id) return;
    try {
      setLoading(true);
      const results = await convex.query(api.agent.GetUserAgents, {
        userId: userDetails._id as Id<"UserTable">,
      });
      setAgentList(results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDetails?._id, convex]);

  useEffect(() => {
    if (userDetails) {
      GetUserAgents();
    }
  }, [userDetails, GetUserAgents]);

  const handleDeleteRequest = (id: Id<"AgentTable">, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setOpenAlert(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAgentMutation({ agentId: deleteId });
      toast.success("Database schema deleted");
      GetUserAgents();
      setOpenAlert(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete database schema");
    }
  };

  // Counts of SQL vs NoSQL schemas across all user projects
  const { sqlCount, nosqlCount } = useMemo(() => {
    let sql = 0;
    let nosql = 0;
    agentList.forEach((agent) => {
      if (getSchemaType(agent) === "nosql") {
        nosql++;
      } else {
        sql++;
      }
    });
    return { sqlCount: sql, nosqlCount: nosql };
  }, [agentList]);

  // Filter and sort the agents
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agentList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((agent) =>
        (agent.name || "").toLowerCase().includes(q)
      );
    }

    // Architecture Type filter (All / SQL / NoSQL)
    if (typeFilter !== "all") {
      result = result.filter((agent) => getSchemaType(agent) === typeFilter);
    }

    // Status filter
    if (statusFilter === "published") {
      result = result.filter((agent) => Boolean(agent.published));
    } else if (statusFilter === "draft") {
      result = result.filter((agent) => !agent.published);
    }

    // Sort order
    if (sortBy === "recent") {
      result.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "entities") {
      result.sort(
        (a, b) => (b.nodes?.length || 0) - (a.nodes?.length || 0)
      );
    }

    return result;
  }, [agentList, searchQuery, typeFilter, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Shimmering Metrics Bar Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border/60 bg-card/60 p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-muted/80 rounded" />
                <div className="h-6 w-6 bg-muted/80 rounded" />
              </div>
              <div className="h-5 w-12 bg-muted/80 rounded" />
            </div>
          ))}
        </div>

        {/* Shimmering Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card/60 p-4 animate-pulse flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-muted/80" />
                  <div className="h-5 w-16 bg-muted/80 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-3/4 bg-muted/80 rounded" />
                  <div className="h-3 w-1/3 bg-muted/80 rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <div className="h-3 w-20 bg-muted/80 rounded" />
                <div className="h-7 w-24 bg-muted/80 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Telemetry / Metrics Bar */}
      <DashboardMetricsBar
        agents={agentList}
        isPaidUser={isPaidUser}
        hasAiPlan={hasAiPlan}
        projectCount={agentList.length}
      />

      {/* Main Workspace Section */}
      <div className="space-y-5">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Your Database Architectures
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-muted text-foreground border border-border/60">
                {agentList.length}
              </span>
            </div>
          </div>

          {/* Search, Filter, Sort and View Switcher */}
          {agentList.length > 0 && (
            <DashboardToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={agentList.length}
              filteredCount={filteredAndSortedAgents.length}
              sqlCount={sqlCount}
              nosqlCount={nosqlCount}
            />
          )}
        </div>

        {/* Empty States */}
        {agentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 my-4 space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center border border-[#ffdf27]/20 shadow-xs">
              <Database className="h-7 w-7 text-[#ffdf27]" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="font-bold text-lg text-foreground">
                No Database Schemas Yet
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create your first relational SQL schema or NoSQL document model with visual tables,
                collections, foreign keys, and instant export.
              </p>
            </div>
            {onOpenCreateDialog && (
              <Button
                onClick={onOpenCreateDialog}
                className="gap-2 font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 text-zinc-950" />
                <span>Create New Schema</span>
              </Button>
            )}
          </div>
        ) : filteredAndSortedAgents.length === 0 ? (
          /* Filtered No Results State */
          <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-border bg-card/30 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <SearchX className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">
                No matching schemas found
              </h4>
              <p className="text-xs text-muted-foreground">
                No schemas matched your current search and filter criteria.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {filteredAndSortedAgents.map((agent) => (
              <SchemaCard
                key={agent._id}
                agent={agent}
                userId={userDetails?._id as Id<"UserTable">}
                onDeleteRequest={handleDeleteRequest}
                onRefresh={GetUserAgents}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <SchemaTableView
            agents={filteredAndSortedAgents}
            userId={userDetails?._id as Id<"UserTable">}
            onDeleteRequest={handleDeleteRequest}
            onRefresh={GetUserAgents}
          />
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete database schema?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete{" "}
              {deleteName ? (
                <span className="font-semibold text-foreground">
                  &ldquo;{deleteName}&rdquo;
                </span>
              ) : (
                "this schema"
              )}
              ? This action cannot be undone. All tables, collections, columns, foreign keys,
              and indexes will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold cursor-pointer"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
