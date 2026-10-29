"use client";
import React from "react";
import { Terminal, Workflow, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Prompt AI or Drop Tables",
      description:
        "Describe your data domain in natural language or visually drop database tables with typed columns, primary keys, and nullability constraints.",
      icon: Terminal,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
      tag: "Schema Modeling",
    },
    {
      step: "02",
      title: "Wire Relations with React Flow",
      description:
        "Drag connection handles between primary keys and foreign keys using React Flow. Configure cardinalities (1:1, 1:N, N:M), foreign key rules, and visual routing.",
      icon: Workflow,
      colorClass: "text-violet-600 dark:text-violet-400",
      bgClass: "bg-violet-500/10 border-violet-500/20",
      tag: "React Flow Wiring",
    },
    {
      step: "03",
      title: "Simulate Cascades & Export SQL",
      description:
        "Simulate CASCADE actions and relational integrity, audit missing indexes, and export production-ready SQL DDL, Prisma schemas, or Mermaid ERDs.",
      icon: FileCheck,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/10 border-amber-500/20",
      tag: "Production DDL",
    },
  ];

  return (
    <section id="how-it-works" className="container mx-auto py-24 px-4 md:px-8 border-t border-border">
      <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
        <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3 py-1 text-xs font-mono">
          Database Flow Workflow
        </Badge>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          How Database Flow Works
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Go from a rough product idea to a battle-tested, normalized database schema in 3 simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-6xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex flex-col rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5 relative hover:border-emerald-500/50 transition-colors shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold font-mono text-muted-foreground/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {step.step}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {step.tag}
                </span>
              </div>

              <div className={`h-11 w-11 rounded-lg flex items-center justify-center border ${step.bgClass} ${step.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
