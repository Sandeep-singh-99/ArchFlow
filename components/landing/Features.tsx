"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Terminal,
  Layers,
  Activity,
  ShieldCheck,
  FileCode,
  Users2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "AI Architecture Copilot",
    description:
      "Type 'Design a multi-region payment gateway with 99.999% SLA' and watch AI generate nodes, connections, and failover topologies instantly.",
    icon: Terminal,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    badge: "AI Powered",
  },
  {
    title: "50+ Distributed System Components",
    description:
      "Drag & drop load balancers, API gateways, microservices, caches, Kafka topics, SQL/NoSQL databases, and cloud services directly onto the canvas.",
    icon: Layers,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    badge: "Canvas UI",
  },
  {
    title: "Live Request Flow Simulator",
    description:
      "Simulate packet flows, verify data paths, and calculate end-to-end P99 latency budgets before writing a single line of code.",
    icon: Activity,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    badge: "Interactive",
  },
  {
    title: "Automated SPOF & Bottleneck Audit",
    description:
      "Identify Single Points of Failure (SPOF), missing read replicas, unbounded queues, and un-cached hot spots with a single click.",
    icon: ShieldCheck,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    badge: "Reliability",
  },
  {
    title: "Mermaid, SVG & Terraform Export",
    description:
      "Export diagrams cleanly to Mermaid.js code for GitHub READMEs, high-res SVG for technical RFCs, or Terraform IaC starter configurations.",
    icon: FileCode,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    badge: "Developer Ready",
  },
  {
    title: "System Design Interview Prep",
    description:
      "Equipped with back-of-the-envelope calculators, bandwidth formulas, and trade-off checklists tailored for Senior/Staff Engineering interviews.",
    icon: Users2,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    badge: "Interview Kit",
  },
];

export default function Features() {
  return (
    <section id="features" className="container mx-auto py-24 px-4 md:px-8">
      <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
        <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono">
          Architecture Capabilities
        </Badge>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Everything You Need to Architect at Scale
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Stop struggling with static drawing tools. ArchFlow combines visual architecture modeling,
          real-time flow animation, and AI reasoning in one intuitive studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className="border border-border bg-card hover:border-foreground/40 transition-colors shadow-2xs group"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${feature.bgClass} ${feature.colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {feature.badge}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
