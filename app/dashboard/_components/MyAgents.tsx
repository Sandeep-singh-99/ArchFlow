"use client";

import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useMutation } from "convex/react";
import {
  Database,
  Plus,
  SearchX,
  RotateCcw,
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
import { getSchemaType } from "@/lib/schemaClassifier";
import { Skeleton } from "@/components/ui/skeleton";

export type DashboardProject = FunctionReturnType<typeof api.agent.GetUserAgentsList>[number];

interface MyAgentsProps {
  agents: DashboardProject[] | undefined;
  userId?: Id<"UserTable">;
  onOpenCreateDialog: () => void;
}

const emptyProjects: DashboardProject[] = [];

export default function MyAgents({ agents, userId, onOpenCreateDialog }: MyAgentsProps) {
  const agentList = agents ?? emptyProjects;
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

    // Sort by creation date, name, or entity count.
    if (sortBy === "recent") {
      result.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      );
    } else if (sortBy === "entities") {
      result.sort((a, b) => {
        return (b.nodeCount ?? 0) - (a.nodeCount ?? 0);
      });
    }

    return result;
  }, [agentList, searchQuery, typeFilter, statusFilter, sortBy]);

  if (!agents) {
    return (
      <div role="status" className="space-y-6">
        <span className="sr-only">Loading your architectures</span>
        {/* Shimmering Metrics Bar Skeleton */}
        <Skeleton aria-hidden className="h-24 rounded-2xl motion-reduce:animate-none" />
        <section aria-labelledby="project-library-loading" className="space-y-4">
          <h2 id="project-library-loading" className="text-xl font-semibold tracking-tight">Your architectures</h2>
          {/* Shimmering Cards Skeleton */}
          <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-48 rounded-2xl motion-reduce:animate-none" />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Telemetry / Metrics Bar */}
      <DashboardMetricsBar agents={agentList} />

      {/* Main Workspace Section */}
      <section aria-labelledby="project-library" className="space-y-4">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="project-library" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Your architectures
            </h2>
            <p aria-live="polite" className="text-sm tabular-nums text-muted-foreground">
              {filteredAndSortedAgents.length === agentList.length
                ? `${agentList.length} ${agentList.length === 1 ? "schema" : "schemas"}`
                : `${filteredAndSortedAgents.length} of ${agentList.length} schemas`}
            </p>
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
              sqlCount={sqlCount}
              nosqlCount={nosqlCount}
            />
          )}
        </div>

        {/* Empty States */}
        {agentList.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-violet-300/20 bg-[radial-gradient(ellipse_at_top,#201b2f,transparent_70%)] px-5 py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center border border-[#ffdf27]/20 shadow-xs">
              <Database className="h-7 w-7 text-[#ffdf27]" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="font-bold text-lg text-foreground">
                Create your first schema
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start a SQL or NoSQL project to model your database in the visual canvas.
              </p>
            </div>
            <Button onClick={onOpenCreateDialog} className="cursor-pointer bg-[#ffe47a] font-semibold text-zinc-950 hover:bg-[#ffed9d]">
              <Plus aria-hidden />
              New schema
            </Button>
          </div>
        ) : filteredAndSortedAgents.length === 0 ? (
          /* Filtered No Results State */
          <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-border bg-card/30 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <SearchX className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">
                No matching schemas
              </h3>
              <p className="text-xs text-muted-foreground">
                Try another search or reset the filters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
                setSortBy("recent");
              }}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedAgents.map((agent) => (
              <SchemaCard
                key={agent._id}
                agent={agent}
                userId={userId}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <SchemaTableView
            agents={filteredAndSortedAgents}
            userId={userId}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </section>

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
