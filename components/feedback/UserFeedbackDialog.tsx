"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import {
  Bug,
  Check,
  CircleAlert,
  Lightbulb,
  Loader2,
  MessageCircle,
  MessageSquareHeart,
  Palette,
  Send,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserDetailContext } from "@/context/UserDetailContext";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface UserFeedbackDialogProps {
  trigger?: ReactNode;
}

const FEEDBACK_TYPES = [
  { id: "bug", label: "Report a bug", icon: Bug, prompt: "What happened, and what did you expect to happen?" },
  { id: "feature_request", label: "Feature idea", icon: Lightbulb, prompt: "What would you like to be able to do in ArchFlow?" },
  { id: "ui_ux", label: "Usability", icon: Palette, prompt: "Which part of ArchFlow could be easier to use?" },
  { id: "performance", label: "Performance", icon: Zap, prompt: "What felt slow, and what were you doing at the time?" },
  { id: "general", label: "General", icon: MessageCircle, prompt: "What would you like the ArchFlow team to know?" },
  { id: "praise", label: "Praise", icon: ThumbsUp, prompt: "What worked especially well for you?" },
] as const;

const RATINGS = ["Poor", "Needs work", "Okay", "Great", "Exceptional"] as const;

export default function UserFeedbackDialog({ trigger }: UserFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form states
  const [selectedType, setSelectedType] = useState<(typeof FEEDBACK_TYPES)[number]>(FEEDBACK_TYPES[1]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const { user } = useUser();
  const { userDetails } = useContext(UserDetailContext);
  const submitFeedback = useMutation(api.admin.SubmitFeedback);

  // Determine user tier
  const rawSub = (userDetails?.subscription || "").toLowerCase();
  const userTier = rawSub.includes("ai") ? "ai" : rawSub.includes("pro") || rawSub === "active" ? "pro" : "free";

  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (nextOpen) {
      setSent(false);
      setSubmitError(null);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (isSubmitting || !trimmedMessage) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitFeedback({
        userId: userDetails?._id,
        userEmail: user?.primaryEmailAddress?.emailAddress || userDetails?.email || "anonymous@user.com",
        userName: user?.fullName || userDetails?.name || "Anonymous User",
        userTier,
        type: selectedType.id,
        rating,
        title: title.trim(),
        message: trimmedMessage,
      });

      setSent(true);
      // Reset form after delivery so a new submission starts with a fresh draft.
      setTitle("");
      setMessage("");
      setRating(5);
      setSelectedType(FEEDBACK_TYPES[1]);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setSubmitError("We couldn’t send your feedback. Try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <MessageSquareHeart aria-hidden className="text-[#ffe47a]" />
            Give feedback
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border-white/10 bg-card p-0 shadow-2xl shadow-black/60 motion-reduce:animate-none sm:max-w-[44rem]"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          if (headingRef.current) {
            event.preventDefault();
            headingRef.current.focus();
          }
        }}
      >
        {sent ? (
          <div className="flex flex-col items-center gap-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#30271a,transparent_70%)] px-5 py-9 text-center sm:px-8 sm:py-12">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[#ffe47a]/25 bg-[#ffe47a]/10 text-[#ffe47a]">
              <Check aria-hidden className="size-7" />
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl tracking-tight">Feedback sent</DialogTitle>
              <DialogDescription>Thanks for sharing your experience with the ArchFlow team.</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button ref={doneRef} className="min-w-24 cursor-pointer bg-[#ffe47a] font-semibold text-zinc-950 hover:bg-[#ffed9d]">Done</Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <DialogHeader className="relative isolate shrink-0 gap-2 overflow-hidden border-b border-border bg-[#15131b] px-5 py-5 text-left sm:px-7 sm:py-6">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#3a2d1e,transparent_68%)]" />
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-2/5 bg-[radial-gradient(#ffe47a42_1px,transparent_1px)] bg-size-[14px_14px] mask-[linear-gradient(90deg,transparent,black)] sm:block" />
              <div className="mb-1 grid size-9 place-items-center rounded-xl border border-[#ffe47a]/20 bg-[#ffe47a]/10 text-[#ffe47a]">
                <MessageSquareHeart aria-hidden className="size-4" />
              </div>
              <DialogTitle ref={headingRef} tabIndex={-1} className="max-w-sm text-2xl tracking-tight outline-none sm:text-3xl">
                Share your feedback
              </DialogTitle>
              <DialogDescription className="max-w-sm leading-relaxed">
                Tell the ArchFlow team what’s working or what could be better.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="space-y-5 border-b border-border bg-muted/25 px-5 py-5 sm:border-r sm:border-b-0 sm:px-7 sm:py-6">
                    {/* Category choices */}
                    <fieldset disabled={isSubmitting}>
                      <legend className="text-sm font-semibold">What’s it about?</legend>
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        {FEEDBACK_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <Label key={type.id} className="block min-w-0">
                              <input
                                type="radio"
                                name="feedback-category"
                                value={type.id}
                                className="peer sr-only"
                                checked={selectedType.id === type.id}
                                onChange={() => setSelectedType(type)}
                              />
                              <span className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/35 px-2 py-2 text-xs leading-tight font-medium text-muted-foreground hover:bg-muted peer-checked:border-[#ffe47a]/40 peer-checked:bg-[#ffe47a]/10 peer-checked:text-[#ffefab] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ffe47a] peer-disabled:cursor-not-allowed">
                                <Icon aria-hidden className="size-3.5 shrink-0" />
                                {type.label}
                              </span>
                            </Label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Star rating */}
                    <fieldset disabled={isSubmitting}>
                      <legend className="text-sm font-semibold">How’s your experience?</legend>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {RATINGS.map((label, index) => {
                          const stars = index + 1;
                          return (
                            <Label key={label} className="block">
                              <input
                                type="radio"
                                name="feedback-rating"
                                value={stars}
                                aria-label={`${stars} out of 5, ${label}`}
                                className="peer sr-only"
                                checked={rating === stars}
                                onChange={() => setRating(stars)}
                              />
                              <span className="grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent hover:bg-muted peer-checked:border-[#ffe47a]/30 peer-checked:bg-[#ffe47a]/10 peer-focus-visible:ring-2 peer-focus-visible:ring-[#ffe47a] peer-disabled:cursor-not-allowed">
                                <Star aria-hidden className={cn("size-4 text-muted-foreground", stars <= rating && "fill-[#ffe47a] text-[#ffe47a]")} />
                              </span>
                            </Label>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{RATINGS[rating - 1]} · {rating}/5</p>
                    </fieldset>
                  </div>

                  <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
                    {/* Title / Summary */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <Label htmlFor={`${id}-summary`}>Summary</Label>
                        <span className="text-xs text-muted-foreground">Optional</span>
                      </div>
                      <Input
                        id={`${id}-summary`}
                        placeholder="A short title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        disabled={isSubmitting}
                        className="h-10 rounded-lg bg-background/35 focus-visible:ring-[#ffe47a]/35"
                        maxLength={100}
                      />
                    </div>

                    {/* Detailed message */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <Label htmlFor={`${id}-message`}>Your feedback</Label>
                        <span aria-hidden className="text-xs text-muted-foreground">Required</span>
                      </div>
                      <Textarea
                        id={`${id}-message`}
                        placeholder={selectedType.prompt}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        disabled={isSubmitting}
                        className="min-h-28 resize-y rounded-lg bg-background/35 focus-visible:ring-[#ffe47a]/35"
                        required
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {submitError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-card px-5 py-3 sm:px-7">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={isSubmitting} className="cursor-pointer text-muted-foreground">Cancel</Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="cursor-pointer bg-[#ffe47a] font-semibold text-zinc-950 hover:bg-[#ffed9d]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 aria-hidden className="motion-safe:animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send aria-hidden /> Send feedback
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
