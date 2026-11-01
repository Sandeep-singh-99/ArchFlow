"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Coins,
  MoreVertical,
  Check,
  UserCheck,
  UserX,
  CreditCard,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  const users = useQuery(api.admin.GetAllUsers, {});
  const updateUserRole = useMutation(api.admin.UpdateUserRole);
  const adjustTokens = useMutation(api.admin.AdjustUserTokens);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro" | "ai">("all");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      // Search
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      // Plan filter
      const sub = (u.subscription || "").toLowerCase();
      let matchesPlan = true;
      if (planFilter === "free") matchesPlan = sub !== "pro" && sub !== "active" && sub !== "ai";
      else if (planFilter === "pro") matchesPlan = sub === "pro" || sub === "active";
      else if (planFilter === "ai") matchesPlan = sub === "ai" || sub === "ai_unlimited";

      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [users, searchQuery, roleFilter, planFilter]);

  const handleRoleToggle = async (userId: any, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserRole({ userId, role: nextRole });
      toast.success(`Role updated to ${nextRole.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role");
    }
  };

  const handleGrantTokens = async (userId: any, currentTokens: number, addAmount: number) => {
    try {
      const nextTotal = currentTokens + addAmount;
      await adjustTokens({ userId, tokens: nextTotal });
      toast.success(`Granted +${addAmount.toLocaleString()} tokens (Total: ${nextTotal.toLocaleString()})`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust tokens");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>User Directory & Role Permissions</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage user roles (Admins vs Standard Users), subscription tiers, and token allocations.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs py-1 px-3 w-fit">
          {filteredUsers.length} of {users?.length || 0} users listed
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border bg-card/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Role filter */}
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    roleFilter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Roles
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("admin")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    roleFilter === "admin" ? "bg-card text-amber-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Admins
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("user")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    roleFilter === "user" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Users
                </button>
              </div>

              {/* Plan filter */}
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setPlanFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    planFilter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Plans
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter("pro")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    planFilter === "pro" ? "bg-card text-emerald-400 shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pro
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter("ai")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    planFilter === "ai" ? "bg-card text-primary shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card className="border-border bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Developer</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">AI Tokens</th>
                <th className="py-3 px-4">Schemas</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!users ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading users directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin";
                  const isPaid = u.subscription === "pro" || u.subscription === "active" || u.subscription === "ai";

                  return (
                    <tr key={String(u._id)} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.imageUrl ? (
                            <img
                              src={u.imageUrl}
                              alt={u.name}
                              className="h-8 w-8 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {u.name.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">{u.name}</span>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono capitalize inline-flex items-center gap-1 ${
                            isAdmin
                              ? "border-amber-500/40 text-amber-400 bg-amber-500/10 font-bold"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {isAdmin ? <Shield className="h-3 w-3 text-amber-400" /> : null}
                          <span>{u.role}</span>
                        </Badge>
                      </td>

                      {/* Subscription Plan */}
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            u.subscription === "ai"
                              ? "border-primary/40 text-primary bg-primary/10"
                              : u.subscription === "pro" || u.subscription === "active"
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {u.planLabel}
                        </Badge>
                      </td>

                      {/* Tokens */}
                      <td className="py-3 px-4 font-mono font-medium">
                        <span className={u.token > 10000 ? "text-emerald-400 font-bold" : "text-foreground"}>
                          {u.token.toLocaleString()}
                        </span>
                      </td>

                      {/* Schemas */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-semibold text-foreground">{u.schemaCount}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                              Manage User
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Toggle Role */}
                            <DropdownMenuItem
                              onClick={() => handleRoleToggle(u._id, u.role)}
                              className="cursor-pointer gap-2"
                            >
                              {isAdmin ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 text-rose-400" />
                                  <span>Demote to Standard User</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                                  <span className="text-amber-400 font-semibold">Promote to Admin</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                              Grant AI Tokens
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => handleGrantTokens(u._id, u.token, 10000)}
                              className="cursor-pointer gap-2"
                            >
                              <Coins className="h-3.5 w-3.5 text-primary" />
                              <span>+10,000 Tokens</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleGrantTokens(u._id, u.token, 50000)}
                              className="cursor-pointer gap-2"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                              <span>+50,000 Tokens</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
