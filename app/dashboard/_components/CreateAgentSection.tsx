"use client";
import { Button } from "@/components/ui/button";
import { Loader, Plus, Workflow, Network, Sparkles, Layers } from "lucide-react";
import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const suggestedTemplates = [
  "E-Commerce Order Pipeline",
  "Ride-Hailing Geospatial Matcher",
  "Distributed Rate Limiter",
  "Video Transcoding & Streaming",
  "Real-Time Chat & Pub/Sub",
  "High-Throughput URL Shortener",
];

export default function CreateAgentSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const CreateAgentMutation = useMutation(api.agent.CreateAgent);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(false);

  const { userDetails } = useContext(UserDetailContext);
  const router = useRouter();
  const { has } = useAuth();
  const isPaidUser = has && has({ plan: "unlimited_plan" });

  const CreateAgent = async (nameToUse?: string) => {
    const finalName = nameToUse || agentName;
    if (!finalName.trim()) {
      toast.error("Please provide an architecture project name");
      return;
    }

    if (!isPaidUser && userDetails && userDetails.token <= 0) {
      toast.error(
        "You have reached your limit of free architecture slots. Please upgrade to Pro to create more."
      );
      return;
    }

    try {
      setLoading(true);
      const agentId = uuidv4();
      await CreateAgentMutation({
        agentId: agentId,
        name: finalName,
        userId: userDetails?._id,
      });
      setOpenDialog(false);
      setLoading(false);
      toast.success("Architecture canvas created!");
      router.push(`/agent-builder/${agentId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      toast.error("Failed to create architecture project");
    }
  };

  return (
    <div className="w-full border-b border-border bg-muted/20 px-6 py-10 md:px-12 lg:px-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs font-mono">
              Architecture Studio
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Canvas v2.0</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            System Design & Flow Visualizer
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Design microservices, distributed queues, databases, and request flow charts with AI guidance.
          </p>
        </div>

        {/* Action Button & Modal */}
        <div className="flex items-center gap-3">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-sm cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>New Architecture</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Workflow className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Create New Architecture</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Give your system design a name, or pick a suggested production topology.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Project / Architecture Name
                  </label>
                  <Input
                    placeholder="e.g. Distributed Order Pipeline"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") CreateAgent();
                    }}
                    autoFocus
                  />
                </div>

                {/* Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Quick Suggestions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTemplates.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => {
                          setAgentName(template);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer text-left"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <Button
                  size="sm"
                  onClick={() => CreateAgent()}
                  disabled={loading || !agentName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 font-semibold"
                >
                  {loading && <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Open Canvas
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
