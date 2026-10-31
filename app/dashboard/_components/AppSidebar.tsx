"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import {
  CreditCard,
  Network,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const NavigationOptions = [
  {
    title: "My Architectures",
    url: "/dashboard",
    icon: Network,
    badge: "Studio",
  },
  {
    title: "Pricing & Plans",
    url: "/dashboard/pricing",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { userDetails, setUserDetails } = useContext(UserDetailContext);
  const path = usePathname();
  const { has } = useAuth();

  const isPaidUser = Boolean(
    (has &&
      (has({ plan: "ai_architect_pro" }) ||
        has({ plan: "pro_architect" }) ||
        has({ plan: "ai_unlimited_plan" }) ||
        has({ plan: "pro_plan" }) ||
        has({ plan: "unlimited_plan" }))) ||
      userDetails?.subscription === "active" ||
      userDetails?.subscription === "pro" ||
      userDetails?.subscription === "ai"
  );
  const convex = useConvex();

  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (userDetails?._id) {
      convex
        .query(api.agent.GetUserAgents, { userId: userDetails._id })
        .then((results) => {
          if (!isMounted) return;
          const count = Number(results?.length || 0);
          setTotalProjects(count);
          const remainingCredits = Math.max(0, 3 - count);
          if (userDetails?.totalRemianingCredits !== remainingCredits) {
            setUserDetails((prev: Record<string, unknown> | null) => ({
              ...(prev || {}),
              totalRemianingCredits: remainingCredits,
            }));
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [
    convex,
    userDetails?._id,
    userDetails?.totalRemianingCredits,
    isPaidUser,
    setUserDetails,
  ]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/80 bg-sidebar transition-all duration-200"
    >
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/60 p-2 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={{
                children: (
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span className="font-semibold text-xs text-foreground">
                      ArchFlow
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Schema Studio
                    </span>
                  </div>
                ),
                className:
                  "bg-zinc-900 border border-zinc-800 text-foreground shadow-md",
              }}
              className="hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
            >
              <Link
                href="/"
                className="flex items-center gap-2.5 w-full group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
              >
                <div className="size-8 rounded-lg bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 flex items-center justify-center shrink-0 shadow-xs shadow-[#ffc507]/20 group-hover:scale-105 transition-transform">
                  <Network
                    className="size-4 text-zinc-950 font-bold"
                    strokeWidth={2.5}
                  />
                </div>
                <div
                  className={`flex flex-col text-left leading-tight min-w-0 ${
                    !open ? "hidden" : "group-data-[collapsible=icon]:hidden"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-foreground truncate">
                      ArchFlow
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-[#ffc507]/20 text-[#ffee72] border border-[#ffdf27]/30">
                      v2.0
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">
                    Schema & ER Studio
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation Links */}
      <SidebarContent>
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 px-2 group-data-[collapsible=icon]:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NavigationOptions.map((option, index) => {
                const isActive = path === option.url;
                return (
                  <SidebarMenuItem key={index} className="flex justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={option.title}
                      className={`font-medium text-xs rounded-lg transition-all ${
                        isActive
                          ? "bg-secondary text-foreground font-semibold border border-border/80 shadow-2xs"
                          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      } group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center`}
                    >
                      <Link
                        href={option.url}
                        className="flex items-center gap-2.5 w-full group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
                      >
                        <option.icon
                          className={`size-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-[#ffee72]"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {option.title}
                        </span>
                        {option.badge && (
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50 group-data-[collapsible=icon]:hidden">
                            {option.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Tier & Quota Status */}
      <SidebarFooter className="border-t border-border/60 p-2 group-data-[collapsible=icon]:p-2">
        {!isPaidUser ? (
          <div className="w-full">
            {open ? (
              <div className="w-full space-y-2.5 p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#ffdf27] shrink-0" />
                    Free Tier
                  </span>
                  <span className="font-semibold text-foreground">
                    {totalProjects} / 1 Slot
                  </span>
                </div>

                {/* Quota Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      totalProjects >= 1
                        ? "bg-amber-400 w-full"
                        : "bg-[#ffdf27] w-0"
                    }`}
                  />
                </div>

                <Link href="/dashboard/pricing" className="block w-full pt-0.5">
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer h-7"
                  >
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            ) : (
              <SidebarMenu>
                <SidebarMenuItem className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    tooltip={{
                      children: `Free Tier: ${totalProjects} / 1 Slot (Click to Upgrade)`,
                      className:
                        "bg-zinc-900 border border-zinc-800 text-foreground text-xs font-mono",
                    }}
                    className="hover:bg-muted text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
                  >
                    <Link
                      href="/dashboard/pricing"
                      className="flex items-center justify-center w-full"
                    >
                      <Zap className="size-4 text-[#ffdf27] shrink-0" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </div>
        ) : open ? (
          <div className="w-full p-2.5 rounded-xl bg-[#ffc507]/10 border border-[#ffdf27]/25 text-xs font-mono text-[#ffee72] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#ffdf27] shrink-0" />
              <span className="font-semibold">Pro Plan Active</span>
            </div>
            <span className="text-[10px] text-[#ffee72]/70 font-mono">
              Unlimited
            </span>
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem className="flex justify-center">
              <SidebarMenuButton
                asChild
                tooltip={{
                  children: "Pro Plan Active — Unlimited Studio Access",
                  className:
                    "bg-zinc-900 border border-zinc-800 text-foreground text-xs font-mono",
                }}
                className="bg-[#ffc507]/10 border border-[#ffdf27]/25 hover:bg-[#ffc507]/20 transition-colors group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
              >
                <Link
                  href="/dashboard/pricing"
                  className="flex items-center justify-center w-full"
                >
                  <Sparkles className="size-4 text-[#ffee72] shrink-0" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
