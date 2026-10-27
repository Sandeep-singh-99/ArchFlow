"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { Agent } from "@/types/AgentTypes";
import { useConvex, useMutation } from "convex/react";
import { Database, Plus } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
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
import { toast } from "sonner";
import SchemaCard from "./SchemaCard";

interface MyAgentsProps {
  onOpenCreateDialog?: () => void;
}

export default function MyAgents({ onOpenCreateDialog }: MyAgentsProps = {}) {
  const { userDetails } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const convex = useConvex();
  const deleteAgentMutation = useMutation(api.agent.DeleteAgent);
  const [deleteId, setDeleteId] = useState<Id<"AgentTable"> | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
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

  const handleDeleteRequest = (id: Id<"AgentTable">, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setOpenAlert(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAgentMutation({ agentId: deleteId });
      toast.success("Database schema deleted");
      GetUserAgents();
      setOpenAlert(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete database schema");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-xl border border-border bg-card/60 p-5 animate-pulse space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/3 bg-muted rounded" />
              </div>
            </div>
            <div className="h-32 bg-muted/60 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (agentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 my-8 space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-[#ffc507]/10 text-[#ffee72] flex items-center justify-center border border-[#ffdf27]/20 shadow-xs">
          <Database className="h-7 w-7 text-[#ffdf27]" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="font-bold text-lg text-foreground">
            No Database Schemas Yet
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create your first relational or NoSQL database schema from scratch using the New Project button above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 space-y-4">
      {/* Header bar showing count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Your Schemas
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground">
            {agentList.length}
          </span>
        </div>
      </div>

      {/* Grid of Enhanced Schema Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {agentList.map((agent) => (
          <SchemaCard
            key={agent._id}
            agent={agent}
            userId={userDetails?._id as Id<"UserTable">}
            onDeleteRequest={handleDeleteRequest}
            onRefresh={GetUserAgents}
          />
        ))}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete database schema?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete{" "}
              {deleteName ? (
                <span className="font-semibold text-foreground">"{deleteName}"</span>
              ) : (
                "this schema"
              )}
              ? This action cannot be undone. All tables, columns, foreign keys, and indexes will be permanently deleted.
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
