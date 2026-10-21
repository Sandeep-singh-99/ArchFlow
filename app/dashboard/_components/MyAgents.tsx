"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { Agent } from "@/types/AgentTypes";
import { useConvex, useMutation } from "convex/react";
import {
  Network,
  Trash2,
  Workflow,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MyAgentsProps {
  onSelectTemplateTab?: () => void;
  onOpenCreateDialog?: () => void;
}

export default function MyAgents({ onSelectTemplateTab }: MyAgentsProps) {
  const { userDetails } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const convex = useConvex();
  const deleteAgentMutation = useMutation(api.agent.DeleteAgent);
  const [deleteId, setDeleteId] = useState<Id<"AgentTable"> | null>(null);
  const [openAlert, setOpenAlert] = useState(false);

  useEffect(() => {
    if (userDetails) {
      GetUserAgents();
    }
  }, [userDetails]);

  const GetUserAgents = async () => {
    if (!userDetails) return;
    try {
      setLoading(true);
      const results = await convex.query(api.agent.GetUserAgents, {
        userId: userDetails._id as Id<"UserTable">,
      });
      setAgentList(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAgentMutation({ agentId: deleteId });
      toast.success("Architecture project deleted");
      GetUserAgents();
      setOpenAlert(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete architecture project");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-xl border border-border bg-card/60 p-5 animate-pulse space-y-4"
          >
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (agentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 my-8 space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
          <Workflow className="h-7 w-7" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="font-bold text-lg text-foreground">
            No System Architectures Yet
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create your first distributed system architecture from scratch, or start with one of our production-ready templates.
          </p>
        </div>
        {onSelectTemplateTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectTemplateTab}
            className="gap-2 text-xs font-semibold cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Browse Architecture Templates</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agentList.map((agent, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5 hover:border-emerald-500/50 transition-all duration-150 shadow-2xs hover:shadow-sm relative group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Network className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                    {agent.published ? "Published" : "Draft"}
                  </Badge>
                  <button
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete Architecture"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteId(agent._id as Id<"AgentTable">);
                      setOpenAlert(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{moment(agent._creationTime).fromNow()}</span>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted-foreground">
                Topology Studio
              </span>
              <Link href={`/agent-builder/${agent.agentId}`}>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer">
                  <span>Open Canvas</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this system architecture?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. All nodes, flow connections, and configuration will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold cursor-pointer"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
