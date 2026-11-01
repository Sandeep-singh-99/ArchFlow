"use client";

import React, { useContext } from "react";
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
import {
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  MessageSquareHeart,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ADMIN_NAVIGATION = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Directory",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Platform Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Earnings & Revenue",
    url: "/admin/earnings",
    icon: DollarSign,
  },
  {
    title: "User Feedback",
    url: "/admin/feedback",
    icon: MessageSquareHeart,
    hasBadge: true,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { userDetails } = useContext(UserDetailContext);

  // Fetch metrics to show badge count on feedback
  const metrics = useQuery(api.admin.GetAdminOverviewMetrics, {});
  const newFeedbackCount = metrics?.feedback?.newCount || 0;

  return (
    <Sidebar className="border-r border-border bg-card/50 backdrop-blur-md">
      {/* Admin Header Branding */}
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-black text-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground">
                  ArchFlow
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono py-0 px-1.5 uppercase font-bold text-amber-400 border-amber-500/30 bg-amber-500/10"
                >
                  Admin
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Platform Command Center
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Nav Content */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground px-3 mb-1">
            Control Tower
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {ADMIN_NAVIGATION.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.url === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-9 rounded-lg px-3 transition-colors text-xs font-medium ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          <span>{item.title}</span>
                        </div>
                        {item.hasBadge && newFeedbackCount > 0 && (
                          <Badge
                            className={`text-[10px] font-mono h-5 px-1.5 ${
                              isActive
                                ? "bg-primary-foreground text-primary font-bold"
                                : "bg-rose-500 text-white font-bold"
                            }`}
                          >
                            {newFeedbackCount}
                          </Badge>
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

      {/* Sidebar Footer */}
      <SidebarFooter className="p-3 border-t border-border mt-auto">
        <div className="flex flex-col gap-2">
          {open && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40 border border-border text-xs">
              <div className="flex flex-col truncate">
                <span className="font-semibold text-[11px] truncate">
                  {userDetails?.name || "Admin Operator"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {userDetails?.email}
                </span>
              </div>
              <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase font-mono">
                Superuser
              </Badge>
            </div>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs font-semibold gap-1.5 justify-center hover:bg-muted cursor-pointer"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              {open && <span>Exit to Studio</span>}
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
