"use client";

import { Suspense, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity, ArrowUpRight, BarChart3, CalendarDays, Check, Clock, Copy,
  Eye, Globe, Laptop, Layers, Link2, Smartphone, Tablet, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Pagination, PaginationButton, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

type Analytics = FunctionReturnType<typeof api.analytics.GetUserAnalytics>;
const number = new Intl.NumberFormat("en-US");
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const panel = "min-w-0 rounded-2xl border border-border bg-card";
const sectionTitle = "text-lg font-semibold tracking-tight text-foreground";
const visitsPerPage = 5;

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}


function getDeviceIcon(device: string) {
  const lower = device.toLowerCase();
  if (lower.includes("mobile") || lower.includes("phone")) return Smartphone;
  if (lower.includes("tablet") || lower.includes("ipad")) return Tablet;
  return Laptop;
}

function EmptyState({ icon: Icon, title, children }: {
  icon: typeof Activity;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="mb-1 grid size-9 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}

function AnalyticsSummary({ data }: { data: Analytics }) {
  const metrics = [
    { label: "Link views", value: number.format(data.totalViews), detail: "Total preview opens", icon: Eye, color: "text-[#ffe47a] bg-[#ffe47a]/10" },
    { label: "Unique visitors", value: number.format(data.uniqueVisitors), detail: "Distinct browser sessions", icon: Users, color: "text-violet-300 bg-violet-300/10" },
    { label: "Total time spent", value: formatDuration(data.totalDurationSeconds), detail: "Across all visits", icon: Clock, color: "text-emerald-300 bg-emerald-300/10" },
    { label: "Average duration", value: formatDuration(data.avgDurationSeconds), detail: "Time per visit", icon: Activity, color: "text-sky-300 bg-sky-300/10" },
  ];

  return (
    <dl aria-label="All-time metrics" className={cn(panel, "grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x")}>
      {metrics.map(({ label, value, detail, icon: Icon, color }, index) => (
        <div key={label} className={cn("min-w-0 px-4 py-4 sm:p-5", index % 2 === 1 && "border-l border-border md:border-l-0", index >= 2 && "border-t border-border md:border-t-0")}>
          <dt className="flex min-h-9 items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", color)}>
              <Icon aria-hidden className="size-4" />
            </span>
            {label}
          </dt>
          <dd className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</dd>
          <dd className="mt-1 text-xs text-muted-foreground">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function DailyTraffic({ days }: { days: Analytics["dailyTrends"] }) {
  const [selectedDate, setSelectedDate] = useState<string>();
  const views = days.reduce((sum, day) => sum + day.views, 0);
  const step = Math.max(1, Math.ceil(Math.max(0, ...days.map((day) => day.views)) / 4));
  const selectedDay = days.find((day) => day.date === selectedDate);
  const start = days[0]?.date;
  const end = days.at(-1)?.date;

  return (
    <section aria-labelledby="daily-traffic" className={cn(panel, "flex flex-col")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="daily-traffic" className={sectionTitle}>Daily traffic</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preview views over the last 14 days</p>
        </div>
        {start && end && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
            <CalendarDays aria-hidden className="size-3.5" />
            {start} – {end}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{number.format(views)}</span>
          <span className="text-sm text-muted-foreground">views in this period</span>
        </div>
        {days.length > 0 && (
          <div className="relative mt-5 h-36 pl-8 sm:h-44 sm:pl-11">
            <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {[4, 3, 2, 1, 0].map((tick) => (
                <div key={tick} className="flex h-0 items-center gap-2">
                  <span className="w-6 text-right font-mono text-[10px] text-muted-foreground sm:w-9">
                    {compactNumber.format(tick * step)}
                  </span>
                  <span className="flex-1 border-t border-border" />
                </div>
              ))}
            </div>
            {views > 0 ? (
              <div role="group" aria-label="Daily preview views" className="relative flex h-full">
                {days.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={`${day.date}, ${number.format(day.views)} views, ${formatDuration(day.durationSeconds)} viewing time`}
                    aria-pressed={selectedDate === day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className="group flex min-w-0 flex-1 cursor-pointer items-end justify-center rounded-t-md outline-none motion-safe:transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffe47a] aria-pressed:bg-[#ffe47a]/8"
                  >
                    <span aria-hidden className={cn("w-[60%] max-w-8 rounded-t-sm", day.views > 0 ? "min-h-0.5 bg-gradient-to-t from-[#a47825] to-[#ffe47a] group-aria-pressed:from-[#c5983a] group-aria-pressed:to-[#fff0a6]" : "h-px bg-white/20")}
                      style={day.views > 0 ? { height: `${(day.views / (step * 4)) * 100}%` } : undefined}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="relative grid h-full place-items-center p-2">
                <span className="rounded-lg border border-border bg-card px-3 py-2 text-center text-sm text-muted-foreground">
                  No views in this period
                </span>
              </div>
            )}
          </div>
        )}
        <div aria-hidden className="mt-2 flex pl-8 sm:pl-11">
          {days.map((day, index) => (
            <span key={day.date} className={cn(
              "min-w-0 flex-1 text-center text-[10px] whitespace-nowrap text-muted-foreground",
              index !== 0 && index !== days.length - 1 && (index % 3 === 0 ? "invisible sm:visible" : "invisible"),
            )}>
              {day.date}
            </span>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="mt-5 flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
        {selectedDay ? (
          <>
            <span className="font-semibold text-foreground">{selectedDay.date}</span>
            <span>{number.format(selectedDay.views)} views</span>
            <span aria-hidden>·</span>
            <span>{formatDuration(selectedDay.durationSeconds)} viewing time</span>
          </>
        ) : (
          <>
            <span aria-hidden className="size-2 rounded-sm bg-[#ffe47a]" />
            <span>Preview views</span>
            {views > 0 && <span className="ml-auto">Select a day for details</span>}
          </>
        )}
      </div>
    </section>
  );
}

function AudienceBreakdown({ data }: { data: Analytics }) {
  const devices = [...data.byDevice].sort((a, b) => b.count - a.count);
  const groups = [
    { title: "Devices", icon: Laptop, color: "bg-violet-300", rows: devices.map((item) => ({ ...item, label: item.device, icon: getDeviceIcon(item.device) })) },
    { title: "Traffic sources", icon: Globe, color: "bg-emerald-300", rows: data.byReferrer.map((item) => ({ ...item, label: item.referrer, icon: Globe })) },
  ];

  return (
    <section aria-labelledby="audience-breakdown" className={cn(panel, "flex flex-col")}>
      <div className="px-4 pt-5 sm:px-6 sm:pt-6">
        <h2 id="audience-breakdown" className={sectionTitle}>Audience breakdown</h2>
        <p className="mt-1 text-sm text-muted-foreground">How visitors reach your previews</p>
      </div>
      <div className="grid flex-1 divide-y divide-border md:max-xl:grid-cols-2 md:max-xl:divide-x md:max-xl:divide-y-0">
        {groups.map(({ title, icon: Icon, color, rows }) => (
          <div key={title} className="min-w-0 px-4 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Icon aria-hidden className="size-4 text-muted-foreground" />
              {title}
            </h3>
            {rows.length ? (
              <ul className="mt-3 space-y-3">
                {rows.map(({ label, icon: RowIcon, count, percentage }) => (
                  <li key={label}>
                    <div className="flex items-center gap-2 text-xs">
                      <RowIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                      <span title={label} className="min-w-0 flex-1 truncate font-medium">{label}</span>
                      <span className="tabular-nums text-muted-foreground">{number.format(count)} <span className="sr-only">views</span></span>
                      <span className="w-9 text-right font-medium tabular-nums">{percentage}%</span>
                    </div>
                    <div aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${(count / data.totalViews) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3 text-xs text-muted-foreground">
                {title === "Devices" ? "No device data yet." : "No traffic sources yet."}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchitecturePerformance({ architectures, copiedId, onCopy }: {
  architectures: Analytics["byArchitecture"];
  copiedId: string | null;
  onCopy: (agentId: string) => void;
}) {
  return (
    <section aria-labelledby="architecture-performance" className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div>
          <h2 id="architecture-performance" className={sectionTitle}>Architecture performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">All-time engagement by shared preview</p>
        </div>
        {architectures.length > 0 && (
          <span className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs tabular-nums text-muted-foreground">
            {number.format(architectures.length)} {architectures.length === 1 ? "preview" : "previews"}
          </span>
        )}
      </div>
      {architectures.length ? (
        <div role="region" aria-label="Architecture performance table" tabIndex={0} className="overflow-x-auto rounded-b-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ffe47a]">
          <table className="w-full min-w-[39rem] text-left text-sm">
            <thead className="border-y border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium sm:pl-6">Architecture</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Views</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Visitors</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Total time</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Avg. time</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {architectures.map((arch) => (
                <tr key={arch.agentId} className="hover:bg-muted/40 focus-within:bg-muted/40">
                  <th scope="row" className="px-4 py-2.5 font-medium sm:pl-6">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#ffe47a]/10 text-[#ffe47a]">
                        <Layers aria-hidden className="size-4" />
                      </span>
                      <span className="max-w-64 wrap-anywhere">{arch.name}</span>
                    </div>
                  </th>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{number.format(arch.views)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{number.format(arch.uniqueVisitors)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{formatDuration(arch.totalDurationSeconds)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-muted-foreground">{formatDuration(arch.avgDurationSeconds)}</td>
                  <td className="py-2.5 pr-4 sm:pr-6">
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="icon" variant="ghost" className="cursor-pointer text-muted-foreground" onClick={() => onCopy(arch.agentId)} aria-label={`Copy preview link for ${arch.name}`} title="Copy preview link">
                        {copiedId === arch.agentId ? <Check aria-hidden className="text-emerald-300" /> : <Copy aria-hidden />}
                      </Button>
                      <Button asChild size="icon" variant="ghost" className="text-muted-foreground">
                        <Link href={`/preview/${arch.agentId}`} target="_blank" rel="noopener noreferrer" aria-label={`Open preview for ${arch.name} in a new tab`} title="Open preview">
                          <ArrowUpRight aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-border bg-muted/25 sm:mx-6 sm:mb-6">
          <EmptyState icon={Link2} title="No preview visits yet">
            <p className="max-w-xs text-sm text-muted-foreground">Open an architecture in the studio and share its preview link to start collecting views.</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard">View architectures <ArrowUpRight aria-hidden /></Link>
            </Button>
          </EmptyState>
        </div>
      )}
    </section>
  );
}

function RecentActivity({ visits }: { visits: Analytics["recentVisits"] }) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.ceil(visits.length / visitsPerPage);
  const page = Math.max(1, Math.min(requestedPage, pageCount));
  const start = (page - 1) * visitsPerPage;
  const end = Math.min(start + visitsPerPage, visits.length);

  return (
    <section aria-labelledby="recent-activity" className={panel}>
      <div className="px-4 py-5 sm:px-6">
        <h2 id="recent-activity" className={sectionTitle}>Recent activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Latest preview visits and session details</p>
      </div>
      {visits.length ? (
        <ol id="recent-activity-visits" start={start + 1} className="divide-y divide-border border-t border-border">
          {visits.slice(start, end).map((visit) => {
            const DeviceIcon = getDeviceIcon(visit.device);
            const time = new Date(visit.timestamp);

            return (
              <li key={visit.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6">
                <span className="grid size-9 place-items-center rounded-lg border border-border bg-muted/60 text-sky-300">
                  <DeviceIcon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="wrap-anywhere text-sm font-medium">{visit.architectureName || "Untitled Architecture"}</p>
                  <p className="mt-0.5 wrap-anywhere text-xs text-muted-foreground">{visit.browser} on {visit.os} · {visit.referrer}</p>
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-3 text-xs tabular-nums sm:col-start-3 sm:gap-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-muted-foreground">
                    <Clock aria-hidden className="size-3" /> {formatDuration(visit.durationSeconds)}
                    <span className="sr-only">viewing time</span>
                  </span>
                  <time className="min-w-16 text-muted-foreground sm:text-right" dateTime={time.toISOString()} title={time.toLocaleString()}>{formatRelativeTime(visit.timestamp)}</time>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="border-t border-border">
          <EmptyState icon={Activity} title="No recent visits" />
        </div>
      )}
      {pageCount > 1 && (
        <div className="flex flex-col items-center gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-between sm:px-6">
          <p role="status" className="text-xs tabular-nums text-muted-foreground">
            Showing {start + 1}–{end} of {visits.length} recent visits
          </p>
          <Pagination aria-label="Recent activity pages" className="m-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious aria-controls="recent-activity-visits" disabled={page === 1} onClick={() => setPage(page - 1)} />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationButton
                    aria-label={`Page ${pageNumber}`}
                    aria-controls="recent-activity-visits"
                    isActive={page === pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationButton>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext aria-controls="recent-activity-visits" disabled={page === pageCount} onClick={() => setPage(page + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}

function AnalyticsLoading() {
  return (
    <div role="status" className="space-y-5">
      <span className="sr-only">Loading analytics</span>
      <div aria-hidden className="space-y-5">
        <Skeleton className="h-56 rounded-2xl md:h-32 motion-reduce:animate-none" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
          <Skeleton className="h-48 rounded-2xl xl:h-full motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-56 rounded-2xl motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function AnalyticsDashboardContent() {
  const { userDetails } = useContext(UserDetailContext);
  const searchParams = useSearchParams();
  const requestedAgentId = searchParams.get("agentId") || "all";
  const [selection, setSelection] = useState<{ requestedId: string; value: string }>();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 1. Fetch user's architectures for the selector filter
  const userAgents = useQuery(
    api.agent.GetUserAgentsList,
    userDetails?._id ? { userId: userDetails._id } : "skip"
  );
  const selectedAgentId = selection?.requestedId === requestedAgentId ? selection.value : requestedAgentId;

  // 2. Fetch aggregated analytics
  const analyticsData = useQuery(
    api.analytics.GetUserAnalytics,
    userDetails?._id ? { userId: userDetails._id, agentId: selectedAgentId } : "skip"
  );
  const cleanDuplicates = useMutation(api.analytics.CleanDuplicateVisits);

  useEffect(() => {
    cleanDuplicates({ agentId: selectedAgentId }).catch(() => {});
  }, [selectedAgentId, cleanDuplicates]);

  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  const handleCopyLink = async (agentId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/preview/${agentId}`);
      clearTimeout(copyTimeout.current);
      setCopiedId(agentId);
      toast.success("Share link copied to clipboard!");
      copyTimeout.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <main className="mx-auto w-full max-w-[90rem] space-y-5 px-4 pt-4 pb-10 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      {/* Top Header & Architecture Filter */}
      <header className="relative isolate overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 sm:px-7 sm:py-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#ffe47a22,transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(#e9cc7240_1px,transparent_1px)] bg-size-[15px_15px] mask-[linear-gradient(120deg,transparent_15%,black)] opacity-60" />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <span className="mb-4 grid size-10 place-items-center rounded-xl border border-[#ffe47a]/25 bg-[#ffe47a]/10 text-[#ffe47a]">
              <BarChart3 aria-hidden className="size-5" />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Share analytics</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">See how often your architecture previews are opened and how long visitors spend exploring them.</p>
          </div>

          {/* Filter Dropdown */}
          <div className="w-full md:w-55 md:shrink-0">
            <label htmlFor="analytics-architecture" className="mb-2 block text-xs font-medium text-muted-foreground">Architecture</label>
            <Select value={selectedAgentId} onValueChange={(value) => setSelection({ requestedId: requestedAgentId, value })}>
              <SelectTrigger id="analytics-architecture" className="w-full cursor-pointer border-white/15 bg-background/60 data-[size=default]:h-10">
                <Layers aria-hidden className="size-4 shrink-0 text-[#ffe47a]" />
                <SelectValue placeholder="All architectures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All architectures</SelectItem>
                {selectedAgentId !== "all" && !userAgents?.some((agent) => agent.agentId === selectedAgentId) && (
                  <SelectItem value={selectedAgentId}>Selected architecture</SelectItem>
                )}
                {userAgents?.map((agent) => (
                  <SelectItem key={agent.agentId} value={agent.agentId}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {analyticsData === undefined ? <AnalyticsLoading /> : (
        <>
          {/* KPI Cards Grid: Total Views, Unique Visitors, Total Time Spent, Avg Duration */}
          <AnalyticsSummary data={analyticsData} />
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
            {/* Daily Views & Engagement Trend Chart */}
            <DailyTraffic key={selectedAgentId} days={analyticsData.dailyTrends} />
            {/* Two Column Section: Devices & Referrers */}
            <AudienceBreakdown data={analyticsData} />
          </div>
          {/* Architectures Performance Table */}
          <ArchitecturePerformance architectures={analyticsData.byArchitecture} copiedId={copiedId} onCopy={handleCopyLink} />
          {/* Live Visitor Activity Feed */}
          <RecentActivity key={selectedAgentId} visits={analyticsData.recentVisits} />
        </>
      )}
    </main>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8"><AnalyticsLoading /></div>}>
      <AnalyticsDashboardContent />
    </Suspense>
  );
}
