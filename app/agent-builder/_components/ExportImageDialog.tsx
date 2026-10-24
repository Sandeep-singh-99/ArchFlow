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
import { ImageIcon, Download, Loader2, Sparkles, FileImage, ShieldCheck } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useReactFlow } from "@xyflow/react";

interface ExportImageDialogProps {
  architectureName?: string;
}

export default function ExportImageDialog({ architectureName = "database-schema" }: ExportImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [background, setBackground] = useState<"transparent" | "dark" | "light">("dark");
  const [isExporting, setIsExporting] = useState(false);
  const { fitView } = useReactFlow();

  const handleExport = async (overrideFormat?: "png" | "svg", overrideBg?: "transparent" | "dark" | "light") => {
    const targetFormat = overrideFormat || format;
    const targetBg = overrideBg || background;

    try {
      setIsExporting(true);

      // Find ReactFlow container or viewport
      const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
      const flowElement = document.querySelector(".react-flow") as HTMLElement;
      const targetElement = viewportElement || flowElement;

      if (!targetElement) {
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

      // Options for high resolution
      const imageOptions = {
        backgroundColor: bgColor,
        pixelRatio: targetFormat === "png" ? 2.5 : 1, // High-res retina
        quality: 1,
        filter: (node: HTMLElement) => {
          // Exclude floating controls, minimap, panels from exported image
          const className = node.className || "";
          if (typeof className === "string") {
            if (
              className.includes("react-flow__panel") ||
              className.includes("react-flow__minimap") ||
              className.includes("react-flow__controls")
            ) {
              return false;
            }
          }
          return true;
        },
      };

      let dataUrl: string;
      if (targetFormat === "svg") {
        dataUrl = await toSvg(targetElement, imageOptions);
      } else {
        dataUrl = await toPng(targetElement, imageOptions);
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

      toast.success(`Exported ${targetFormat.toUpperCase()} high-res schema image!`);
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

        <DropdownMenuContent align="end" className="w-52 p-1.5 text-xs">
          <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground px-2 py-1">
            Quick 1-Click Export
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport("png", "dark")}
            className="flex items-center gap-2 p-2 rounded cursor-pointer"
          >
            <FileImage className="h-4 w-4 text-sky-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">High-Res PNG</span>
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
              <span className="text-[10px] text-muted-foreground">For Docs & Notion</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport("svg", "transparent")}
            className="flex items-center gap-2 p-2 rounded cursor-pointer"
          >
            <Download className="h-4 w-4 text-violet-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs">Vector SVG</span>
              <span className="text-[10px] text-muted-foreground">Lossless Scalable Vector</span>
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
              <span>Export High-Resolution Schema Image</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Download presentation-ready architecture graphics for pull requests, RFCs, and team wikis.
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
                  <div className="text-[10px] text-muted-foreground">Crystal clear bitmap</div>
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
                  <div className="text-[10px] text-muted-foreground">Infinitely zoomable</div>
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
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
