"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

interface RenameProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: Id<"AgentTable">;
  currentName: string;
  onSuccess?: (newName: string) => void;
}

export default function RenameProjectModal({
  open,
  onOpenChange,
  agentId,
  currentName,
  onSuccess,
}: RenameProjectModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const renameMutation = useMutation(api.agent.RenameAgent);

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Schema name cannot be empty");
      return;
    }

    if (trimmed === currentName.trim()) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      await renameMutation({
        agentId,
        name: trimmed,
      });
      toast.success("Database schema renamed successfully");
      onSuccess?.(trimmed);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to rename database schema";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#ffc507]/15 text-[#ffdf27] flex items-center justify-center">
                <Pencil className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">
                Rename Project
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the display name of your database architecture project.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="project-name" className="text-xs font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Core Schema"
              className="font-medium text-sm"
              autoFocus
              maxLength={80}
              disabled={loading}
            />
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Choose a descriptive name</span>
              <span className="font-mono">{name.length}/80</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !name.trim()}
              className="text-xs font-semibold bg-[#ffdf27] text-black hover:bg-[#ffee72]"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
