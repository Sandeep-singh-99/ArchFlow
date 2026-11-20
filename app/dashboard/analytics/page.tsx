"use client";

import React, { useContext, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Eye,
  Users,
  Clock,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Share2,
  Layers,
  Database,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
  if (lower.includes("mobile") || lower.includes("phone")) {
    return <Smartphone className="size-4 text-emerald-400 shrink-0" />;
  }
  if (lower.includes("tablet") || lower.includes("ipad")) {
    return <Tablet className="size-4 text-sky-400 shrink-0" />;
  }
  return <Laptop className="size-4 text-[#ffee72] shrink-0" />;
}

function AnalyticsDashboardContent() {
  const { userDetails } = useContext(UserDetailContext);
  const searchParams = useSearchParams();
  const initialAgentId = searchParams.get("agentId") || "all";

  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch user's architectures for the selector filter
  const userAgents = useQuery(
    api.agent.GetUserAgentsList,
    userDetails?._id ? { userId: userDetails._id } : "skip"
  );

  // 2. Fetch aggregated analytics
  const analyticsData = useQuery(
    api.analytics.GetUserAnalytics,
    userDetails?._id
      ? {
          userId: userDetails._id,
          agentId: selectedAgentId,
        }
      : "skip"
  );

  const cleanDuplicates = useMutation(api.analytics.CleanDuplicateVisits);

  React.useEffect(() => {
    cleanDuplicates({ agentId: selectedAgentId }).catch(() => {});
  }, [selectedAgentId, cleanDuplicates]);

  const handleCopyLink = async (agentId: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/preview/${agentId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(agentId);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const dailyTrends = analyticsData?.dailyTrends;
  const maxDailyViews = useMemo(() => {
    if (!dailyTrends || dailyTrends.length === 0) return 1;
    const max = Math.max(...dailyTrends.map((d) => d.views));
    return max > 0 ? max : 1;
  }, [dailyTrends]);

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Architecture Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#ffc507]/15 border border-[#ffdf27]/30 flex items-center justify-center text-[#ffee72]">
              <BarChart3 className="size-4.5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Share & Link Analytics
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              Real-time
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Analyze visitor clicks, time spent exploring schemas, and audience engagement across all shared links.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-[200px] sm:w-[240px] h-9 text-xs font-medium bg-card border-border/80">
              <SelectValue placeholder="All Architectures" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/80">
              <SelectItem value="all" className="text-xs">
                All Architectures ({userAgents?.length || 0})
              </SelectItem>
              {userAgents?.map((agent) => (
                <SelectItem key={agent.agentId} value={agent.agentId} className="text-xs">
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Views */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Link Views
            </CardTitle>
            <div className="size-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Eye className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {analyticsData?.totalViews ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total impressions across shared previews
            </p>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Unique Visitors
            </CardTitle>
            <div className="size-8 rounded-lg bg-[#ffc507]/10 border border-[#ffdf27]/20 flex items-center justify-center text-[#ffee72]">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {analyticsData?.uniqueVisitors ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Distinct visitor browser sessions
            </p>
          </CardContent>
        </Card>

        {/* Total Time Spent */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Time Spent
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {formatDuration(analyticsData?.totalDurationSeconds ?? 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cumulative time visitors spent viewing
            </p>
          </CardContent>
        </Card>

        {/* Avg Duration */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg. Duration
            </CardTitle>
            <div className="size-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {formatDuration(analyticsData?.avgDurationSeconds ?? 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Average exploration time per visitor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Views & Engagement Trend Chart */}
      <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-[#ffee72]" />
                <span>Link Views & Activity (Last 14 Days)</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Daily visitor click trends and canvas interaction volume.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono w-fit bg-muted/40 border-border/60">
              14-Day Timeline
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsData?.dailyTrends && analyticsData.dailyTrends.length > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1">
                {analyticsData.dailyTrends.map((day, idx) => {
                  const heightPercent = Math.max(
                    8,
                    Math.round((day.views / maxDailyViews) * 100)
                  );
                  const hasViews = day.views > 0;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-zinc-900 border border-zinc-700 text-foreground text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap pointer-events-none">
                        <span className="font-bold">{day.date}</span>
                        <span className="text-[#ffee72]">
                          {day.views} {day.views === 1 ? "view" : "views"} • {formatDuration(day.durationSeconds)}
                        </span>
                      </div>

                      {/* View count pill above bar on hover */}
                      {hasViews && (
                        <span className="text-[9px] font-mono text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.views}
                        </span>
                      )}

                      {/* The bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm sm:rounded-t-md transition-all duration-300 ${
                          hasViews
                            ? "bg-gradient-to-t from-[#ffc507]/60 via-[#ffdf27] to-[#ffee72] group-hover:brightness-125 shadow-xs shadow-[#ffc507]/20"
                            : "bg-muted/40 group-hover:bg-muted/70"
                        }`}
                      />

                      {/* Day Label */}
                      <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/80 mt-2 truncate max-w-full">
                        {day.date.split(" ")[1] || day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
              No trend data available yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Section: Devices & Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Laptop className="size-4 text-emerald-400" />
              <span>Visitor Device Types</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Breakdown of screens used by schema viewers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData?.byDevice && analyticsData.byDevice.length > 0 ? (
              analyticsData.byDevice.map((dev, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(dev.device)}
                      <span className="font-medium text-foreground">{dev.device}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">
                      {dev.count} views ({dev.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dev.percentage}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No device telemetry collected yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources & Referrers */}
        <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="size-4 text-sky-400" />
              <span>Traffic & Referrer Sources</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Where visitors opened your preview link from.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData?.byReferrer && analyticsData.byReferrer.length > 0 ? (
              analyticsData.byReferrer.map((ref, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {ref.referrer}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {ref.count} views ({ref.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${ref.percentage}%` }}
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No referrer telemetry recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Architectures Performance Table */}
      <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Database className="size-4 text-[#ffee72]" />
                <span>Architecture Engagement Leaderboard</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Views and time spent for each individual shared database model.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyticsData?.byArchitecture && analyticsData.byArchitecture.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-mono uppercase text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="pb-2.5 font-semibold">Architecture</th>
                    <th className="pb-2.5 font-semibold text-right">Views</th>
                    <th className="pb-2.5 font-semibold text-right">Visitors</th>
                    <th className="pb-2.5 font-semibold text-right">Total Time</th>
                    <th className="pb-2.5 font-semibold text-right">Avg Time</th>
                    <th className="pb-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {analyticsData.byArchitecture.map((arch) => (
                    <tr key={arch.agentId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-sans font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center shrink-0">
                            <Layers className="size-3.5" />
                          </div>
                          <span className="truncate max-w-[180px] sm:max-w-[280px]">
                            {arch.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-foreground">
                        {arch.views}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {arch.uniqueVisitors}
                      </td>
                      <td className="py-3 text-right text-emerald-400">
                        {formatDuration(arch.totalDurationSeconds)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatDuration(arch.avgDurationSeconds)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-sans">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyLink(arch.agentId)}
                            title="Copy preview link"
                          >
                            {copiedId === arch.agentId ? (
                              <Check className="size-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            asChild
                            size="icon"
                            variant="ghost"
                            className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Open preview"
                          >
                            <Link href={`/preview/${arch.agentId}`} target="_blank">
                              <ExternalLink className="size-3.5" />
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
            <div className="py-8 text-center space-y-3">
              <div className="size-10 rounded-full bg-muted/50 border border-border/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Share2 className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No link clicks recorded yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Copy and share the preview link from your studio navbar. As soon as anyone clicks the link, live stats will stream here!
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link href="/dashboard">Go to My Architectures</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Visitor Activity Feed */}
      <Card className="bg-card/90 border-border/70 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-sky-400" />
            <span>Recent Visitor Activity Log</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Latest visitor sessions and viewing durations in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData?.recentVisits && analyticsData.recentVisits.length > 0 ? (
            <div className="space-y-2">
              {analyticsData.recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-md bg-zinc-900 border border-border/60 flex items-center justify-center shrink-0">
                      {getDeviceIcon(visit.device)}
                    </div>
                    <div className="text-xs min-w-0">
                      <span className="font-semibold text-foreground truncate block">
                        {visit.architectureName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {visit.browser} on {visit.os} • Source: {visit.referrer}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono shrink-0 pl-9 sm:pl-0">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      <Clock className="size-3 mr-1" />
                      {formatDuration(visit.durationSeconds)} spent
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(visit.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No recent visitor events recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          <div className="size-8 rounded-lg bg-[#ffc507]/20 border border-[#ffdf27]/30 flex items-center justify-center animate-spin text-[#ffee72]">
            <BarChart3 className="size-4" />
          </div>
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  );
}
