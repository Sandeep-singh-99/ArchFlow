import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

interface VisitRecord {
  _id?: string;
  agentId: string;
  architectureName: string;
  visitorSessionId: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  durationSeconds: number;
  timestamp: number;
}

function deduplicateVisitsList<T extends VisitRecord>(visits: T[]): T[] {
  const seenSessions = new Set<string>();
  const result: T[] = [];

  // Sort ascending by timestamp to keep the earliest record
  const sorted = [...visits].sort((a, b) => a.timestamp - b.timestamp);

  for (const v of sorted) {
    if (seenSessions.has(v.visitorSessionId)) {
      const existing = result.find((r) => r.visitorSessionId === v.visitorSessionId);
      if (existing) {
        existing.durationSeconds = Math.max(existing.durationSeconds, v.durationSeconds);
      }
      continue;
    }

    seenSessions.add(v.visitorSessionId);
    result.push({ ...v });
  }

  return result;
}

export const RecordLinkVisit = mutation({
  args: {
    agentId: v.string(),
    visitorSessionId: v.string(),
    referrer: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("AgentTable")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      return null;
    }

    // 1. Deduplicate identical visitorSessionId for this agent
    const existingBySession = await ctx.db
      .query("LinkAnalyticsTable")
      .withIndex("by_visitorSessionId", (q) =>
        q.eq("visitorSessionId", args.visitorSessionId)
      )
      .collect();

    if (existingBySession.length > 0) {
      // If duplicates already exist, delete extra rows and return the first
      if (existingBySession.length > 1) {
        for (let i = 1; i < existingBySession.length; i++) {
          await ctx.db.delete(existingBySession[i]._id);
        }
      }
      return existingBySession[0]._id;
    }

    const cleanReferrer = (args.referrer && args.referrer.trim()) || "Direct";
    const cleanDevice = args.device || "Desktop";
    const cleanBrowser = args.browser || "Unknown";
    const cleanOs = args.os || "Unknown";

    return await ctx.db.insert("LinkAnalyticsTable", {
      agentId: args.agentId,
      ownerUserId: agent.userId,
      architectureName: agent.name,
      visitorSessionId: args.visitorSessionId,
      referrer: cleanReferrer,
      device: cleanDevice,
      browser: cleanBrowser,
      os: cleanOs,
      durationSeconds: 0,
      timestamp: Date.now(),
    });
  },
});

export const CleanDuplicateVisits = mutation({
  args: {
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let visits = await ctx.db.query("LinkAnalyticsTable").collect();
    if (args.agentId && args.agentId !== "all") {
      visits = visits.filter((v) => v.agentId === args.agentId);
    }

    const seenSessions = new Set<string>();
    const toDeleteIds: Id<"LinkAnalyticsTable">[] = [];
    const kept: typeof visits = [];

    // Sort ascending by timestamp to keep earliest record
    visits.sort((a, b) => a.timestamp - b.timestamp);

    for (const v of visits) {
      if (seenSessions.has(v.visitorSessionId)) {
        const existing = kept.find((prev) => prev.visitorSessionId === v.visitorSessionId);
        if (existing) {
          existing.durationSeconds = Math.max(existing.durationSeconds, v.durationSeconds);
        }
        toDeleteIds.push(v._id);
        continue;
      }

      seenSessions.add(v.visitorSessionId);
      kept.push(v);
    }

    for (const id of toDeleteIds) {
      await ctx.db.delete(id);
    }

    return { deletedCount: toDeleteIds.length, keptCount: kept.length };
  },
});

export const HeartbeatVisitDuration = mutation({
  args: {
    visitorSessionId: v.string(),
    additionalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("LinkAnalyticsTable")
      .withIndex("by_visitorSessionId", (q) =>
        q.eq("visitorSessionId", args.visitorSessionId)
      )
      .collect();

    if (visits.length === 0) {
      return false;
    }

    // If duplicate rows exist with same visitorSessionId, delete extras
    if (visits.length > 1) {
      for (let i = 1; i < visits.length; i++) {
        await ctx.db.delete(visits[i]._id);
      }
    }

    const visit = visits[0];
    const nextDuration = Math.min(
      (visit.durationSeconds || 0) + Math.max(0, args.additionalSeconds),
      86400
    );

    await ctx.db.patch(visit._id, {
      durationSeconds: nextDuration,
    });

    return true;
  },
});

export const GetAgentAnalytics = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rawVisits = await ctx.db
      .query("LinkAnalyticsTable")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    const visits = deduplicateVisitsList(rawVisits);

    const totalViews = visits.length;
    const uniqueVisitors = new Set(visits.map((v) => v.visitorSessionId)).size;
    const totalDurationSeconds = visits.reduce(
      (acc, v) => acc + (v.durationSeconds || 0),
      0
    );
    const avgDurationSeconds =
      totalViews > 0 ? Math.round(totalDurationSeconds / totalViews) : 0;

    return {
      totalViews,
      uniqueVisitors,
      totalDurationSeconds,
      avgDurationSeconds,
    };
  },
});

export const GetUserAnalytics = query({
  args: {
    userId: v.id("UserTable"),
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rawVisits = await ctx.db
      .query("LinkAnalyticsTable")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", args.userId))
      .collect();

    if (args.agentId && args.agentId !== "all") {
      rawVisits = rawVisits.filter((v) => v.agentId === args.agentId);
    }

    // Deduplicate any concurrent or redundant visit records
    const visits = deduplicateVisitsList(rawVisits);

    const totalViews = visits.length;
    const uniqueVisitors = new Set(visits.map((v) => v.visitorSessionId)).size;
    const totalDurationSeconds = visits.reduce(
      (acc, v) => acc + (v.durationSeconds || 0),
      0
    );
    const avgDurationSeconds =
      totalViews > 0 ? Math.round(totalDurationSeconds / totalViews) : 0;

    // 1. Group by Architecture
    const archMap = new Map<
      string,
      {
        agentId: string;
        name: string;
        views: number;
        uniqueSet: Set<string>;
        totalDurationSeconds: number;
      }
    >();

    visits.forEach((v) => {
      const existing = archMap.get(v.agentId) || {
        agentId: v.agentId,
        name: v.architectureName || "Untitled Architecture",
        views: 0,
        uniqueSet: new Set<string>(),
        totalDurationSeconds: 0,
      };

      existing.views += 1;
      existing.uniqueSet.add(v.visitorSessionId);
      existing.totalDurationSeconds += v.durationSeconds || 0;
      archMap.set(v.agentId, existing);
    });

    const byArchitecture = Array.from(archMap.values())
      .map((item) => ({
        agentId: item.agentId,
        name: item.name,
        views: item.views,
        uniqueVisitors: item.uniqueSet.size,
        totalDurationSeconds: item.totalDurationSeconds,
        avgDurationSeconds:
          item.views > 0
            ? Math.round(item.totalDurationSeconds / item.views)
            : 0,
      }))
      .sort((a, b) => b.views - a.views);

    // 2. Group by Device
    const deviceCounts: Record<string, number> = {};
    visits.forEach((v) => {
      const dev = v.device || "Desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const byDevice = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
    }));

    // 3. Group by Referrer
    const referrerCounts: Record<string, number> = {};
    visits.forEach((v) => {
      const ref = v.referrer || "Direct";
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });

    const byReferrer = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({
        referrer,
        count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Daily Trends (last 14 days)
    const now = new Date();
    const dayMap = new Map<string, { date: string; views: number; durationSeconds: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(key, { date: label, views: 0, durationSeconds: 0 });
    }

    visits.forEach((v) => {
      const visitDate = new Date(v.timestamp);
      const key = visitDate.toISOString().split("T")[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.views += 1;
        entry.durationSeconds += v.durationSeconds || 0;
      }
    });

    const dailyTrends = Array.from(dayMap.values());

    // 5. Recent Visits (latest 20)
    const recentVisits = [...visits]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map((v) => ({
        id: v._id || v.visitorSessionId,
        agentId: v.agentId,
        architectureName: v.architectureName,
        timestamp: v.timestamp,
        device: v.device || "Desktop",
        browser: v.browser || "Unknown",
        os: v.os || "Unknown",
        referrer: v.referrer || "Direct",
        durationSeconds: v.durationSeconds || 0,
      }));

    return {
      totalViews,
      uniqueVisitors,
      totalDurationSeconds,
      avgDurationSeconds,
      byArchitecture,
      byDevice,
      byReferrer,
      dailyTrends,
      recentVisits,
    };
  },
});
