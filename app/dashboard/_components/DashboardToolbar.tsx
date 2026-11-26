"use client";

import { Boxes, Database, LayoutGrid, List, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  sqlCount: number;
  nosqlCount: number;
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
  const schemaTypes = [
    { value: "all", label: "All types" },
    { value: "sql", label: "SQL", count: sqlCount, icon: Database },
    { value: "nosql", label: "NoSQL", count: nosqlCount, icon: Boxes },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative w-full sm:min-w-40 sm:flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Search schemas by name"
            placeholder="Search schemas…"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 bg-background/50 pr-10 pl-9 focus-visible:ring-[#ffe47a]/45"
          />
          {searchQuery && (
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => onSearchChange("")} aria-label="Clear search"
              className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer text-muted-foreground"
            >
              <X aria-hidden />
            </Button>
          )}
        </div>

        {/* Filter, Sort & View Controls */}
        {/* Status Filter (All / Published / Draft) */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger aria-label="Filter by status" className="cursor-pointer data-[size=default]:h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort options */}
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger aria-label="Sort schemas" className="cursor-pointer data-[size=default]:h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="entities">Most entities</SelectItem>
          </SelectContent>
        </Select>

        {/* The view buttons share a border to show that they control one setting. */}
        <div role="group" aria-label="Project layout" className="ml-auto flex shrink-0 gap-0.5 rounded-lg border border-border bg-background/50 p-0.5">
          {/* View Switcher Toggle (Grid vs Table) */}
          {([{ mode: "grid", label: "Grid view", icon: LayoutGrid }, { mode: "table", label: "Table view", icon: List }] as const).map(({ mode, label, icon: Icon }) => (
            <Button key={mode} type="button" variant="ghost" size="icon-sm" onClick={() => onViewModeChange(mode)}
              aria-label={label} aria-pressed={viewMode === mode} title={label}
              className={cn("cursor-pointer text-muted-foreground", viewMode === mode && "bg-white/10 text-foreground")}
            >
              <Icon aria-hidden />
            </Button>
          ))}
        </div>
      </div>

      {/* Architecture Type Filter (All / SQL / NoSQL) */}
      <div role="group" aria-label="Schema type" className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
        {schemaTypes.map((type) => (
          <Button key={type.value} type="button" variant="ghost" size="sm" aria-pressed={typeFilter === type.value}
            onClick={() => onTypeFilterChange(type.value)}
            className={cn("cursor-pointer border border-transparent text-muted-foreground", typeFilter === type.value && "border-violet-300/20 bg-violet-300/10 text-violet-100")}
          >
            {"icon" in type && <type.icon aria-hidden />}
            {type.label}
            {"count" in type && <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{type.count}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}
