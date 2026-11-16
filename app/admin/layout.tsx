"use client";

import React, { useContext } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminHeader } from "./_components/AdminHeader";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userDetails } = useContext(UserDetailContext);

  // Still loading auth state
  if (!isLoaded || userDetails === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono">
          Verifying security privileges...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Authentication Required</h2>
          <p className="text-xs text-muted-foreground">
            Please sign in with an authorized account to access the administrative command center.
          </p>
          <Button asChild className="w-full h-9 text-xs font-semibold">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not an admin
  const isAdmin = userDetails?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Administrator Access Required</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account (<span className="font-mono text-foreground">{user?.primaryEmailAddress?.emailAddress}</span>) is currently registered with standard <span className="font-semibold text-primary">user</span> privileges. Access to the administrative command center is restricted to authorized platform administrators.
            </p>
          </div>

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full h-9 text-xs font-medium">
              <Link href="/dashboard" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Studio Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-col flex-1 h-screen overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
