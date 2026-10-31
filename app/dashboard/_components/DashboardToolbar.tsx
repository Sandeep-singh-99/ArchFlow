"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowDownAZ,
  Clock,
  Layers,
  Database,
  Boxes,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterStatus = "all" | "published" | "draft";
export type TypeFilter = "all" | "sql" | "nosql";
export type SortOption = "recent" | "name" | "entities";
export type ViewMode = "grid" | "table";

interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount?: number;
  filteredCount?: number;
  sqlCount?: number;
  nosqlCount?: number;
}

export default function DashboardToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  sqlCount,
  nosqlCount,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search schemas by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8 h-9 text-xs bg-card/60 border-border/80 focus-visible:ring-1 focus-visible:ring-[#ffdf27]/50"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter, Sort & View Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Architecture Type Filter (All / SQL / NoSQL) */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card/60 p-0.5">
          <button
            type="button"
            onClick={() => onTypeFilterChange("all")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              typeFilter === "all"
                ? "bg-secondary text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Types
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange("sql")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === "sql"
                ? "bg-[#ffdf27]/15 text-[#ffee72] border border-[#ffdf27]/30 shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-3 w-3 text-[#ffdf27]" />
            <span>SQL</span>
            {typeof sqlCount === "number" && (
              <span className="text-[10px] font-mono opacity-70">({sqlCount})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange("nosql")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === "nosql"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="h-3 w-3 text-emerald-400" />
            <span>NoSQL</span>
            {typeof nosqlCount === "number" && (
              <span className="text-[10px] font-mono opacity-70">({nosqlCount})</span>
            )}
          </button>
        </div>

        {/* Status Filter (All / Published / Draft) */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card/60 p-0.5">
          {(
            [
              { id: "all", label: "All" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Draft" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-secondary text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="w-[145px]">
          <Select
            value={sortBy}
            onValueChange={(val) => onSortByChange(val as SortOption)}
          >
            <SelectTrigger className="h-9 text-xs bg-card/60 border-border/80">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recent" className="text-xs cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Recently Updated
                </span>
              </SelectItem>
              <SelectItem value="name" className="text-xs cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                  Name (A-Z)
                </span>
              </SelectItem>
              <SelectItem value="entities" className="text-xs cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  Most Entities
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Distinct Divider Spacing between Sort and View Switcher */}
        <div className="h-4 w-px bg-border/80 hidden sm:block mx-0.5" />

        {/* View Switcher Toggle (Grid vs Table) */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card/60 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className={`h-7 w-7 rounded-md cursor-pointer ${
              viewMode === "grid"
                ? "bg-secondary text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange("table")}
            className={`h-7 w-7 rounded-md cursor-pointer ${
              viewMode === "table"
                ? "bg-secondary text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Table View"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
