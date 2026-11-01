"use client";

import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareHeart,
  Star,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  MessageCircle,
  ThumbsUp,
  Send,
  Loader2,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface UserFeedbackDialogProps {
  trigger?: React.ReactNode;
}

const FEEDBACK_TYPES = [
  { id: "bug", label: "Bug Report", icon: Bug, color: "text-rose-400 border-rose-500/30" },
  { id: "feature_request", label: "Feature Idea", icon: Lightbulb, color: "text-amber-400 border-amber-500/30" },
  { id: "ui_ux", label: "UI / UX", icon: Palette, color: "text-purple-400 border-purple-500/30" },
  { id: "performance", label: "Speed", icon: Zap, color: "text-sky-400 border-sky-500/30" },
  { id: "general", label: "General", icon: MessageCircle, color: "text-slate-400 border-slate-500/30" },
  { id: "praise", label: "Praise", icon: ThumbsUp, color: "text-emerald-400 border-emerald-500/30" },
];

export default function UserFeedbackDialog({ trigger }: UserFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState<string>("feature_request");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const { user } = useUser();
  const { userDetails } = useContext(UserDetailContext);
  const submitFeedback = useMutation(api.admin.SubmitFeedback);

  // Determine user tier
  const rawSub = (userDetails?.subscription || "").toLowerCase();
  const userTier = rawSub.includes("ai") ? "ai" : rawSub.includes("pro") || rawSub === "active" ? "pro" : "free";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a feedback message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId: userDetails?._id,
        userEmail: user?.primaryEmailAddress?.emailAddress || userDetails?.email || "anonymous@user.com",
        userName: user?.fullName || userDetails?.name || "Anonymous User",
        userTier,
        type: selectedType,
        rating,
        title: title.trim(),
        message: message.trim(),
      });

      toast.success("Thank you! Your feedback has been sent directly to the ArchFlow team.");
      setOpen(false);
      // Reset form
      setTitle("");
      setMessage("");
      setRating(5);
      setSelectedType("feature_request");
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      toast.error(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border hover:bg-muted"
          >
            <MessageSquareHeart className="h-3.5 w-3.5 text-pink-400" />
            <span>Give Feedback</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquareHeart className="h-4 w-4 text-pink-400" />
              <span>Share Your Feedback</span>
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono capitalize">
              {userTier === "ai" ? "AI Unlimited" : userTier === "pro" ? "Pro Plan" : "Free Plan"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Help us improve ArchFlow! Report bugs, propose database features, or share suggestions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Category Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Feedback Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map((ft) => {
                const Icon = ft.icon;
                const isSelected = selectedType === ft.id;
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setSelectedType(ft.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border/70 hover:border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${ft.color}`} />
                    <span className="truncate">{ft.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Overall Satisfaction</Label>
              <span className="text-xs font-semibold text-amber-400">
                {rating === 5 ? "Exceptional (5/5)" : rating === 4 ? "Great (4/5)" : rating === 3 ? "Okay (3/5)" : rating === 2 ? "Needs Work (2/5)" : "Poor (1/5)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title / Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-title" className="text-xs font-medium text-muted-foreground">
              Summary <span className="text-muted-foreground/60">(Optional)</span>
            </Label>
            <Input
              id="fb-title"
              placeholder="e.g. Add support for SQLite foreign key cascades"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>

          {/* Detailed Message */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-msg" className="text-xs font-medium text-muted-foreground">
              Your Feedback <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="fb-msg"
              placeholder="Type your message, suggestions, or bug description here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs min-h-[90px] resize-y"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !message.trim()}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
