"use client";

import React, { useState } from "react";
import {
  useReactFlow,
  useViewport,
  Panel,
} from "@xyflow/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Grid,
  Map,
  Keyboard,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type BackgroundVariantType = "dots" | "lines" | "cross" | "none";

interface FlowControlsProps {
  isLocked?: boolean;
  setIsLocked?: (locked: boolean | ((prev: boolean) => boolean)) => void;
  bgVariant?: BackgroundVariantType;
  setBgVariant?: (
    variant:
      | BackgroundVariantType
      | ((prev: BackgroundVariantType) => BackgroundVariantType)
  ) => void;
  showMiniMap?: boolean;
  setShowMiniMap?: (show: boolean | ((prev: boolean) => boolean)) => void;
  className?: string;
}

export default function FlowControls({
  isLocked = false,
  setIsLocked,
  bgVariant = "dots",
  setBgVariant,
  showMiniMap = true,
  setShowMiniMap,
  className = "",
}: FlowControlsProps) {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Calculate clean zoom percentage
  const zoomPercent = Math.round(zoom * 100);

  const handleZoomReset = () => {
    zoomTo(1, { duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 400, padding: 0.25 });
  };

  const cycleBackground = () => {
    if (!setBgVariant) return;
    const variants: BackgroundVariantType[] = ["dots", "lines", "cross", "none"];
    const currentIndex = variants.indexOf(bgVariant);
    const nextVariant = variants[(currentIndex + 1) % variants.length];
    setBgVariant(nextVariant);
  };

  return (
    <Panel position="bottom-left" className={`m-3.5 z-20 ${className}`}>
      <TooltipProvider delayDuration={150}>
        <div className="relative flex items-center gap-1 p-1 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border/80 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/25">
          {/* Zoom Out */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomOut({ duration: 300 })}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              Zoom Out <span className="text-muted-foreground ml-1 font-mono">(Ctrl -)</span>
            </TooltipContent>
          </Tooltip>

          {/* Zoom Percentage / Quick Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleZoomReset}
                className="h-8 min-w-[52px] px-1.5 rounded-lg font-mono text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border border-transparent hover:border-border/60"
                aria-label="Reset zoom to 100%"
              >
                <span>{zoomPercent}%</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              Reset Zoom to 100%
            </TooltipContent>
          </Tooltip>

          {/* Zoom In */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomIn({ duration: 300 })}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              Zoom In <span className="text-muted-foreground ml-1 font-mono">(Ctrl +)</span>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* Fit View */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFitView}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                aria-label="Fit view"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              Fit View <span className="text-muted-foreground ml-1 font-mono">(Auto center)</span>
            </TooltipContent>
          </Tooltip>

          {/* Lock / Interactive Canvas Mode */}
          {setIsLocked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLocked((prev) => !prev)}
                  className={`h-8 w-8 rounded-lg active:scale-95 transition-all cursor-pointer ${
                    isLocked
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label={isLocked ? "Unlock canvas" : "Lock canvas"}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                {isLocked ? "Canvas Locked (Click to unlock)" : "Lock Canvas Movements"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Divider */}
          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* Grid Style Switcher */}
          {setBgVariant && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleBackground}
                  className={`h-8 w-8 rounded-lg active:scale-95 transition-all cursor-pointer ${
                    bgVariant !== "none"
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                      : "text-muted-foreground/40 hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label="Cycle grid background"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                Grid: <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">{bgVariant}</span> (Click to switch)
              </TooltipContent>
            </Tooltip>
          )}

          {/* MiniMap Toggle */}
          {setShowMiniMap && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMiniMap((prev) => !prev)}
                  className={`h-8 w-8 rounded-lg active:scale-95 transition-all cursor-pointer ${
                    showMiniMap
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label={showMiniMap ? "Hide minimap" : "Show minimap"}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                {showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Shortcuts Quick Reference Button */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShortcuts((prev) => !prev)}
                  className={`h-8 w-8 rounded-lg active:scale-95 transition-all cursor-pointer ${
                    showShortcuts
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label="Canvas shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                Keyboard & Canvas Tips
              </TooltipContent>
            </Tooltip>

            {/* Floating Quick Reference Card */}
            {showShortcuts && (
              <div
                className="absolute bottom-11 left-0 w-64 p-3 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-50 text-xs flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/80">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Canvas Gestures</span>
                  </div>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="text-muted-foreground hover:text-foreground text-[10px] px-1 py-0.5 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-1.5 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Pan canvas</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] text-foreground border border-border">
                      Drag / Space+Drag
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Zoom in / out</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] text-foreground border border-border">
                      Wheel / Pinch
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Multi-select</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] text-foreground border border-border">
                      Shift + Drag
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Connect nodes</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] text-foreground border border-border">
                      Drag Port
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delete item</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px] text-foreground border border-border">
                      Backspace / Del
                    </kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </Panel>
  );
}
