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

const MenuOptions = [
  {
    title: "My Architectures / Projects",
    url: "/dashboard",
    icon: Network,
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

  const [totalRemianingCredits, setTotalRemianingCredits] = useState(3);

  useEffect(() => {
    let isMounted = true;
    if (!isPaidUser && userDetails?._id) {
      convex
        .query(api.agent.GetUserAgents, { userId: userDetails._id })
        .then((results) => {
          if (!isMounted) return;
          const remainingCredits = Math.max(0, 3 - Number(results?.length || 0));
          setTotalRemianingCredits(remainingCredits);
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
  }, [convex, userDetails?._id, userDetails?.totalRemianingCredits, isPaidUser, setUserDetails]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border/60 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={{
                children: (
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span className="font-semibold text-xs text-foreground">ArchFlow</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Database Schema Studio
                    </span>
                  </div>
                ),
                className: "bg-zinc-900 border border-zinc-800 text-foreground shadow-md",
              }}
              className="hover:bg-sidebar-accent/80 data-[state=open]:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/" className="flex items-center gap-2.5 w-full">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 flex items-center justify-center shrink-0 shadow-xs shadow-[#ffc507]/20 group-hover:scale-105 transition-transform">
                  <Network className="h-4 w-4 text-zinc-950 font-bold" strokeWidth={2.5} />
                </div>
                <div className={`flex flex-col text-left leading-tight min-w-0 ${!open ? "hidden" : "group-data-[collapsible=icon]:hidden"}`}>
                  <span className="font-bold text-sm tracking-tight text-foreground truncate">
                    ArchFlow
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">
                    Database Schema Studio
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MenuOptions.map((option, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    size={open ? "lg" : "default"}
                    isActive={path === option.url}
                    tooltip={option.title}
                    className="hover:bg-muted data-[active=true]:bg-muted font-medium text-sm group-data-[collapsible=icon]:justify-center"
                  >
                    <Link href={option.url}>
                      <option.icon className={`h-4 w-4 ${path === option.url ? "text-[#ffee72]" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <span>{option.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2 group-data-[collapsible=icon]:p-2">
        {!isPaidUser ? (
          <div className="w-full">
            {open ? (
              <div className="w-full space-y-3 p-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-[#ffdf27] shrink-0" />
                  <span>
                    Free Slots: <strong className="text-foreground">{totalRemianingCredits} / 3</strong>
                  </span>
                </div>
                <Link href="/dashboard/pricing" className="block w-full">
                  <Button size="sm" className="w-full text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            ) : (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="default"
                    tooltip={{
                      children: `Free Slots: ${totalRemianingCredits} / 3 (Upgrade to Pro)`,
                      className: "bg-zinc-900 border border-zinc-800 text-foreground",
                    }}
                    className="hover:bg-muted group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
                  >
                    <Link href="/dashboard/pricing" className="flex items-center justify-center">
                      <div className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Zap className="h-4 w-4 text-[#ffdf27]" />
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </div>
        ) : (
          open ? (
            <div className="text-xs font-mono text-[#ffee72] bg-[#ffc507]/10 p-2.5 rounded border border-[#ffdf27]/20 m-2">
              Unlimited Pro Active
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="default"
                  tooltip={{
                    children: "Unlimited Pro Active",
                    className: "bg-zinc-900 border border-zinc-800 text-foreground",
                  }}
                  className="group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
                >
                  <div className="h-8 w-8 rounded-md bg-[#ffc507]/10 border border-[#ffdf27]/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-[#ffee72]" />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
