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
    title: "AI Database Schema Copilot",
    description:
      "Prompt in natural language: 'Create an e-commerce schema with users, orders, products, and inventory'. Watch AI generate normalized tables, constraints, and relationships instantly.",
    icon: Terminal,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    badge: "AI Powered",
  },
  {
    title: "React Flow Schema Canvas",
    description:
      "Model relational tables and NoSQL collections on a fluid node canvas powered by React Flow. Enjoy column-level connection handles, auto-layout, and sub-pixel dragging.",
    icon: Layers,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    badge: "React Flow Engine",
  },
  {
    title: "Interactive Foreign Key Flows",
    description:
      "Visually trace relationships between primary and foreign keys with animated React Flow edges. Validate 1:1, 1:N, and N:M cardinality paths in real-time.",
    icon: Activity,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    badge: "Interactive Flow",
  },
  {
    title: "CASCADE Drop & Integrity Audits",
    description:
      "Identify orphaned foreign keys, missing indexes on join columns, circular references, and simulate ON DELETE CASCADE consequences before running production migrations.",
    icon: ShieldCheck,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    badge: "Schema Integrity",
  },
  {
    title: "Production SQL DDL & Migration Export",
    description:
      "Export clean, production-ready DDL scripts for PostgreSQL, MySQL, SQLite, and Prisma schema definitions, or export Mermaid ER diagrams for repository documentation.",
    icon: FileCode,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 border-teal-500/20",
    badge: "Developer Ready",
  },
  {
    title: "Domain Boundaries & Schema Grouping",
    description:
      "Organize enterprise multi-table schemas into visual domain containers (Auth, Billing, Logistics, Analytics) with custom color themes and bounded context isolation.",
    icon: Users2,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    badge: "Domain Driven",
  },
];

export default function Features() {
  return (
    <section id="features" className="container mx-auto py-24 px-4 md:px-8">
      <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
        <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 px-3 py-1 text-xs font-mono">
          Database Flow Capabilities
        </Badge>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Everything You Need to Model Database Flows at Scale
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Stop wrestling with static ER diagrams and disjointed migration scripts. ArchFlow combines visual database modeling,
          interactive React Flow relationships, and AI schema generation in one intuitive studio.
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
