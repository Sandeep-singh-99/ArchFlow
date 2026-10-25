"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageIcon, Download, Loader2, Sparkles, FileImage } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useReactFlow, getViewportForBounds } from "@xyflow/react";

interface ExportImageDialogProps {
  architectureName?: string;
}

export default function ExportImageDialog({ architectureName = "database-schema" }: ExportImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [background, setBackground] = useState<"transparent" | "dark" | "light">("dark");
  const [isExporting, setIsExporting] = useState(false);
  const { getNodes, getInternalNode } = useReactFlow();

  const handleExport = async (overrideFormat?: "png" | "svg", overrideBg?: "transparent" | "dark" | "light") => {
    const targetFormat = overrideFormat || format;
    const targetBg = overrideBg || background;

    try {
      setIsExporting(true);

      const nodes = getNodes();
      if (!nodes || nodes.length === 0) {
        toast.error("No schema components on canvas to export");
        setIsExporting(false);
        return;
      }

      // Ensure all web fonts are loaded so text rendering and dimensions are accurate
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // 1. Calculate the exact, comprehensive bounding box of all nodes across the canvas
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((node) => {
        // Query internal React Flow node for measured dimensions and absolute position
        const internalNode = getInternalNode?.(node.id);

        // Query actual rendered DOM element if present
        const domNode = document.querySelector(`.react-flow__node[data-id="${node.id}"]`) as HTMLElement;
        const domWidth = domNode ? domNode.offsetWidth : 0;
        const domHeight = domNode ? domNode.offsetHeight : 0;

        const width =
          domWidth ||
          internalNode?.measured?.width ||
          node.measured?.width ||
          node.width ||
          node.initialWidth ||
          320;

        const height =
          domHeight ||
          internalNode?.measured?.height ||
          node.measured?.height ||
          node.height ||
          node.initialHeight ||
          240;

        const posX =
          internalNode?.internals?.positionAbsolute?.x ??
          node.position?.x ??
          0;
        const posY =
          internalNode?.internals?.positionAbsolute?.y ??
          node.position?.y ??
          0;

        if (posX < minX) minX = posX;
        if (posY < minY) minY = posY;
        if (posX + width > maxX) maxX = posX + width;
        if (posY + height > maxY) maxY = posY + height;
      });

      if (minX === Infinity || minY === Infinity) {
        minX = 0;
        minY = 0;
        maxX = 1200;
        maxY = 800;
      }

      // Generous safety headroom to ensure top handles, badges, tags, and glow shadows are never clipped
      const topSafetyMargin = 60;
      const horizontalSafetyMargin = 60;
      const bottomSafetyMargin = 60;

      const expandedBounds = {
        x: minX - horizontalSafetyMargin,
        y: minY - topSafetyMargin,
        width: Math.max(100, maxX - minX + horizontalSafetyMargin * 2),
        height: Math.max(100, maxY - minY + topSafetyMargin + bottomSafetyMargin),
      };

      // 2. Set export dimensions with padding so the entire diagram fits perfectly regardless of user zoom or pan
      const baseWidth = Math.max(1400, Math.ceil(expandedBounds.width + 120));
      const baseHeight = Math.max(900, Math.ceil(expandedBounds.height + 120));

      // 3. Compute viewport transform that displays the entire diagram
      const viewport = getViewportForBounds(
        expandedBounds,
        baseWidth,
        baseHeight,
        0.1,
        2.0,
        0.08
      );

      // Find the ReactFlow viewport element
      const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewportElement) {
        toast.error("Could not find canvas elements to export");
        setIsExporting(false);
        return;
      }

      const bgColor =
        targetBg === "transparent"
          ? "transparent"
          : targetBg === "dark"
          ? "#09090b"
          : "#ffffff";

      // Options for whole-diagram high-resolution export
      // Explicitly setting transformOrigin: "0 0" guarantees the viewport scales from top-left,
      // preventing top/left nodes from being shifted upwards or clipped.
      const imageOptions = {
        backgroundColor: bgColor,
        width: baseWidth,
        height: baseHeight,
        style: {
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
          overflow: "visible",
        },
        pixelRatio: targetFormat === "png" ? 2.5 : 1, // Retina crispness
        quality: 1,
        filter: (node: HTMLElement) => {
          // Exclude floating controls, minimap, panels from exported image
          const className =
            typeof node.className === "string"
              ? node.className
              : (node as any)?.className?.baseVal || "";
          if (
            className.includes("react-flow__panel") ||
            className.includes("react-flow__minimap") ||
            className.includes("react-flow__controls")
          ) {
            return false;
          }
          return true;
        },
      };

      let dataUrl: string;
      if (targetFormat === "svg") {
        const rawSvgDataUrl = await toSvg(viewportElement, imageOptions);

        let svgContent: string;
        if (rawSvgDataUrl.startsWith("data:image/svg+xml;charset=utf-8,")) {
          svgContent = decodeURIComponent(
            rawSvgDataUrl.replace("data:image/svg+xml;charset=utf-8,", "")
          );
        } else if (rawSvgDataUrl.startsWith("data:image/svg+xml;base64,")) {
          const base64Str = rawSvgDataUrl.replace("data:image/svg+xml;base64,", "");
          try {
            svgContent = new TextDecoder().decode(
              Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0))
            );
          } catch {
            svgContent = atob(base64Str);
          }
        } else {
          svgContent = rawSvgDataUrl;
        }

        // Embed edge dot animation and ONLY remove scrollbars on nodes (not webpage scrollbar)
        const svgEmbeddedStyle = `
          <style>
            @keyframes react-flow__dash {
              from {
                stroke-dashoffset: 10;
              }
              to {
                stroke-dashoffset: 0;
              }
            }

            .react-flow__edge-path,
            .animated path,
            path.animated,
            path[stroke-dasharray] {
              stroke-dasharray: 5 5 !important;
              animation: react-flow__dash 0.5s linear infinite !important;
            }

            /* ONLY remove inner node scrollbars - do NOT remove webpage scrollbar */
            .react-flow__node,
            .react-flow__node * {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            .react-flow__node *::-webkit-scrollbar {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
            }
          </style>
        `;

        let cleanedSvg = svgContent;
        if (cleanedSvg.includes("<svg")) {
          cleanedSvg = cleanedSvg.replace(/(<svg[^>]*>)/i, `$1${svgEmbeddedStyle}`);
        }

        const blob = new Blob([cleanedSvg], { type: "image/svg+xml;charset=utf-8" });
        dataUrl = URL.createObjectURL(blob);
      } else {
        dataUrl = await toPng(viewportElement, imageOptions);
      }

      // Trigger automatic download
      const safeName = architectureName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const filename = `${safeName}-architecture.${targetFormat}`;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (targetFormat === "svg") {
        setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
      }

      toast.success(`Exported complete ${targetFormat.toUpperCase()} schema diagram!`);
      setOpen(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold hover:border-primary/40 cursor-pointer shadow-xs"
          >
            <ImageIcon className="h-3.5 w-3.5 text-sky-500" />
            <span>Export Image</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 p-1.5 text-xs">
          <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground px-2 py-1">
            Export Entire Schema
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport("png", "dark")}
            className="flex items-center gap-2 p-2 rounded cursor-pointer"
          >
            <FileImage className="h-4 w-4 text-sky-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Whole Diagram PNG</span>
              <span className="text-[10px] text-muted-foreground">Dark Studio Background</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport("png", "transparent")}
            className="flex items-center gap-2 p-2 rounded cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Transparent PNG</span>
              <span className="text-[10px] text-muted-foreground">Whole Diagram for Notion/PRs</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport("svg", "transparent")}
            className="flex items-center gap-2 p-2 rounded cursor-pointer"
          >
            <Download className="h-4 w-4 text-violet-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Vector SVG</span>
              <span className="text-[10px] text-muted-foreground">Whole Lossless Scalable Vector</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="p-2 text-xs font-semibold text-center text-primary cursor-pointer hover:bg-muted"
          >
            Custom Export Options...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Export Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileImage className="h-4 w-4 text-sky-500" />
              <span>Export Entire Schema Diagram</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Always captures the full database architecture centered with padding, regardless of current canvas zoom or pan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">File Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("png")}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    format === "png"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">PNG (2.5x Retina)</div>
                  <div className="text-[10px] text-muted-foreground">Full diagram high-res bitmap</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("svg")}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    format === "svg"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs">Vector SVG</div>
                  <div className="text-[10px] text-muted-foreground">Full diagram vector graphics</div>
                </button>
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Canvas Background</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBackground("dark")}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    background === "dark"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs">Dark Studio</div>
                  <div className="text-[10px] text-muted-foreground">#09090b</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBackground("transparent")}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    background === "transparent"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs">Transparent</div>
                  <div className="text-[10px] text-muted-foreground">Clean Alpha</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBackground("light")}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    background === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-semibold text-xs">Light Clean</div>
                  <div className="text-[10px] text-muted-foreground">#ffffff</div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport()}
              disabled={isExporting}
              className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Rendering Full Schema...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Whole {format.toUpperCase()}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
