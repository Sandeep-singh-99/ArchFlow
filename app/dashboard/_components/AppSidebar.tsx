"use client";

import { useContext } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  CreditCard,
  Layers,
  MessageSquareHeart,
  Network,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserFeedbackDialog from "@/components/feedback/UserFeedbackDialog";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { getUserPlanCode, getPlanProjectQuota, PLAN_NAMES } from "@/lib/planAccess";
import { cn } from "@/lib/utils";

const navigation = [
  { title: "My Architectures", url: "/dashboard", icon: Layers },
  { title: "Share Analytics", url: "/dashboard/analytics", icon: ChartNoAxesCombined },
  { title: "Pricing & Plans", url: "/dashboard/pricing", icon: CreditCard },
] as const;

const planStyles = {
  free: { icon: Zap, color: "border-[#ffe47a]/20 bg-[#ffe47a]/10 text-[#ffe47a]" },
  pro: { icon: Layers, color: "border-sky-300/20 bg-sky-300/10 text-sky-200" },
  ai: { icon: Sparkles, color: "border-violet-300/25 bg-violet-300/10 text-violet-200" },
};

const menuButton = "h-10 cursor-pointer gap-3 rounded-lg px-3 font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground focus-visible:ring-[#ffe47a] focus-visible:ring-inset group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!";

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { userDetails } = useContext(UserDetailContext);
  const path = usePathname();
  const { has } = useAuth();

  const activePlans = useQuery(api.plans.GetActivePlans, {});
  const projects = useQuery(
    api.agent.GetUserAgentsList,
    userDetails?._id ? { userId: userDetails._id } : "skip",
  );
  const userPlan = getUserPlanCode(userDetails, has);
  const quota = getPlanProjectQuota(userPlan, activePlans, userDetails?.subscriptionPlanId);
  const totalProjects = projects?.length;
  const isUnlimited = quota >= 999;
  const planName = PLAN_NAMES[userPlan];
  const planAction = userPlan === "free" ? "Explore plans" : "View plan";
  const { icon: PlanIcon, color: planColor } = planStyles[userPlan];
  const usageLabel = totalProjects === undefined
    ? "Loading project usage…"
    : isUnlimited
      ? `${totalProjects} ${totalProjects === 1 ? "project" : "projects"} · Unlimited`
      : `${totalProjects} of ${quota} project slots used`;

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border motion-reduce:transition-none">
      <div className="flex min-h-0 flex-1 flex-col bg-[#0e0e14]">
        {/* Brand header */}
        <SidebarHeader className="relative flex-row items-center gap-2 border-b border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-1">
          <SidebarMenu>
            <SidebarMenuItem className="flex justify-center">
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip="ArchFlow home"
                className={cn(menuButton, "h-12 px-2")}
              >
                <Link href="/" aria-label="ArchFlow home" onNavigate={closeMobile}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ffe47a] text-zinc-950">
                    <Network aria-hidden className="size-4.5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="block text-sm leading-tight font-semibold tracking-tight text-foreground">ArchFlow</span>
                    <span className="mt-0.5 block text-xs leading-tight text-muted-foreground">Schema Studio</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {isMobile && (
            <Button type="button" variant="ghost" size="icon" aria-label="Close sidebar" onClick={closeMobile} className="cursor-pointer text-muted-foreground">
              <X aria-hidden />
            </Button>
          )}
        </SidebarHeader>

        {/* Main navigation links */}
        <SidebarContent className="gap-2 overflow-x-hidden py-3 group-data-[collapsible=icon]:overflow-y-auto">
          <nav aria-label="Workspace navigation">
            <SidebarGroup className="px-3 py-0 group-data-[collapsible=icon]:px-1">
              <SidebarGroupLabel className="mb-1 h-7 px-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                Workspace
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {navigation.map(({ title, url, icon: Icon }) => {
                    const isActive = path === url;
                    return (
                      <SidebarMenuItem key={url} className="flex justify-center">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={title}
                          className={cn(
                            menuButton,
                            "relative border border-transparent data-[active=true]:border-[#ffe47a]/20 data-[active=true]:bg-[#ffe47a]/10 data-[active=true]:font-semibold data-[active=true]:text-[#ffefab]",
                          )}
                        >
                          <Link href={url} aria-label={title} aria-current={isActive ? "page" : undefined} onNavigate={closeMobile}>
                            <Icon aria-hidden />
                            <span className="min-w-0 group-data-[collapsible=icon]:hidden">{title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>

          <SidebarSeparator className="mx-4 my-1 group-data-[collapsible=icon]:mx-2" />

          {/* Give feedback button */}
          <SidebarGroup className="px-3 py-0 group-data-[collapsible=icon]:px-1">
            <SidebarMenu>
              <SidebarMenuItem className="flex justify-center">
                <UserFeedbackDialog
                  trigger={
                    <SidebarMenuButton type="button" aria-label="Give feedback" tooltip="Give feedback" className={menuButton}>
                      <MessageSquareHeart aria-hidden className="text-violet-200" />
                      <span className="group-data-[collapsible=icon]:hidden">Feedback</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar footer: tier and quota status */}
        <SidebarFooter className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-1">
          <section aria-label="Workspace plan" className="rounded-xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,#242034,#15141d_75%)] p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2.5">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", planColor)}>
                <PlanIcon aria-hidden className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Current plan</p>
                <p className="wrap-anywhere text-sm font-semibold">{planName}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed tabular-nums text-muted-foreground">{usageLabel}</p>

            {/* Quota progress bar */}
            {!isUnlimited && totalProjects !== undefined && (
              <div
                role="progressbar"
                aria-label="Project slots used"
                aria-valuemin={0}
                aria-valuemax={quota}
                aria-valuenow={Math.min(totalProjects, quota)}
                aria-valuetext={usageLabel}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/45"
              >
                <div className="h-full rounded-full bg-[#ffe47a]" style={{ width: Math.min((totalProjects / quota) * 100, 100) + "%" }} />
              </div>
            )}

            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-3 h-8 w-full justify-between border-white/10 bg-white/5 text-xs hover:bg-white/10 focus-visible:ring-[#ffe47a]"
            >
              <Link href="/dashboard/pricing" onNavigate={closeMobile}>{planAction} <ArrowUpRight aria-hidden /></Link>
            </Button>
          </section>

          <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
            <SidebarMenuItem className="flex justify-center">
              <SidebarMenuButton
                asChild
                tooltip={planName + " · " + usageLabel}
                className={cn(menuButton, "border hover:bg-white/10", planColor)}
              >
                <Link href="/dashboard/pricing" aria-label={planAction + " for " + planName} onNavigate={closeMobile}>
                  <PlanIcon aria-hidden />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
