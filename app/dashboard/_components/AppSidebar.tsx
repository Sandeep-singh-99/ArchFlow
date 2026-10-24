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
  Layers,
  Network,
  Workflow,
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
    title: "Templates",
    url: "/dashboard?tab=template",
    icon: Layers,
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
  const isPaidUser = has && has({ plan: "unlimited_plan" });
  const convex = useConvex();

  const [totalRemianingCredits, setTotalRemianingCredits] = useState(3);

  useEffect(() => {
    if (!isPaidUser && userDetails) {
      GetUserAgent();
    }
  }, [userDetails, isPaidUser]);

  const GetUserAgent = async () => {
    try {
      const results = await convex.query(api.agent.GetUserAgents, {
        userId: userDetails?._id,
      });
      const remainingCredits = Math.max(0, 3 - Number(results?.length || 0));

      setTotalRemianingCredits(remainingCredits);

      if (userDetails?.totalRemianingCredits !== remainingCredits) {
        setUserDetails((prev: any) => ({
          ...prev,
          totalRemianingCredits: remainingCredits,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border/60 py-4">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
            <Network className="h-4 w-4 text-zinc-950 font-bold" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">
                ArchFlow
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                Database Schema Studio
              </span>
            </div>
          )}
        </Link>
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
                    className="hover:bg-muted data-[active=true]:bg-muted font-medium text-sm"
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

      <SidebarFooter className="border-t border-border/60 p-4">
        {!isPaidUser ? (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-[#ffdf27]" />
              {open && (
                <span>
                  Free Slots: <strong className="text-foreground">{totalRemianingCredits} / 3</strong>
                </span>
              )}
            </div>
            {open && (
              <Link href="/dashboard/pricing" className="block w-full">
                <Button size="sm" className="w-full text-xs font-semibold bg-gradient-to-r from-[#ffc507] via-[#ffee72] to-[#ffdf27] text-zinc-950 hover:brightness-105 border-none shadow-xs cursor-pointer">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
        ) : (
          open && (
            <div className="text-xs font-mono text-[#ffee72] bg-[#ffc507]/10 p-2.5 rounded border border-[#ffdf27]/20">
              Unlimited Pro Active
            </div>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
