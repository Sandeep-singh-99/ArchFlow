export type DomainColorTheme =
  | "indigo"
  | "emerald"
  | "amber"
  | "purple"
  | "cyan"
  | "rose"
  | "blue"
  | "slate";

export interface DomainThemeConfig {
  id: DomainColorTheme;
  label: string;
  badge: string;
  border: string;
  borderDashed: string;
  bg: string;
  headerBg: string;
  text: string;
  accent: string;
  shadow: string;
  ring: string;
}

export const DOMAIN_THEMES: Record<DomainColorTheme, DomainThemeConfig> = {
  indigo: {
    id: "indigo",
    label: "Indigo / Security",
    badge: "border-indigo-500/40 text-indigo-500 dark:text-indigo-400 bg-indigo-500/10",
    border: "border-indigo-500/40 hover:border-indigo-500/80",
    borderDashed: "border-dashed border-indigo-500/40",
    bg: "bg-indigo-500/[0.03] dark:bg-indigo-950/20",
    headerBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    text: "text-indigo-600 dark:text-indigo-400",
    accent: "#6366f1",
    shadow: "shadow-indigo-500/10",
    ring: "ring-indigo-500/30",
  },
  emerald: {
    id: "emerald",
    label: "Emerald / Finance",
    badge: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    border: "border-emerald-500/40 hover:border-emerald-500/80",
    borderDashed: "border-dashed border-emerald-500/40",
    bg: "bg-emerald-500/[0.03] dark:bg-emerald-950/20",
    headerBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    accent: "#10b981",
    shadow: "shadow-emerald-500/10",
    ring: "ring-emerald-500/30",
  },
  amber: {
    id: "amber",
    label: "Amber / Catalog",
    badge: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    border: "border-amber-500/40 hover:border-amber-500/80",
    borderDashed: "border-dashed border-amber-500/40",
    bg: "bg-amber-500/[0.03] dark:bg-amber-950/20",
    headerBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    accent: "#f59e0b",
    shadow: "shadow-amber-500/10",
    ring: "ring-amber-500/30",
  },
  purple: {
    id: "purple",
    label: "Purple / Analytics",
    badge: "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10",
    border: "border-purple-500/40 hover:border-purple-500/80",
    borderDashed: "border-dashed border-purple-500/40",
    bg: "bg-purple-500/[0.03] dark:bg-purple-950/20",
    headerBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    text: "text-purple-600 dark:text-purple-400",
    accent: "#a855f7",
    shadow: "shadow-purple-500/10",
    ring: "ring-purple-500/30",
  },
  cyan: {
    id: "cyan",
    label: "Cyan / Comms",
    badge: "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
    border: "border-cyan-500/40 hover:border-cyan-500/80",
    borderDashed: "border-dashed border-cyan-500/40",
    bg: "bg-cyan-500/[0.03] dark:bg-cyan-950/20",
    headerBg: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    text: "text-cyan-600 dark:text-cyan-400",
    accent: "#06b6d4",
    shadow: "shadow-cyan-500/10",
    ring: "ring-cyan-500/30",
  },
  rose: {
    id: "rose",
    label: "Rose / Compliance",
    badge: "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10",
    border: "border-rose-500/40 hover:border-rose-500/80",
    borderDashed: "border-dashed border-rose-500/40",
    bg: "bg-rose-500/[0.03] dark:bg-rose-950/20",
    headerBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    accent: "#f43f5e",
    shadow: "shadow-rose-500/10",
    ring: "ring-rose-500/30",
  },
  blue: {
    id: "blue",
    label: "Blue / Users",
    badge: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10",
    border: "border-blue-500/40 hover:border-blue-500/80",
    borderDashed: "border-dashed border-blue-500/40",
    bg: "bg-blue-500/[0.03] dark:bg-blue-950/20",
    headerBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    accent: "#3b82f6",
    shadow: "shadow-blue-500/10",
    ring: "ring-blue-500/30",
  },
  slate: {
    id: "slate",
    label: "Slate / Core",
    badge: "border-slate-500/40 text-slate-600 dark:text-slate-400 bg-slate-500/10",
    border: "border-slate-500/40 hover:border-slate-500/80",
    borderDashed: "border-dashed border-slate-500/40",
    bg: "bg-slate-500/[0.03] dark:bg-slate-900/30",
    headerBg: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    text: "text-slate-600 dark:text-slate-400",
    accent: "#64748b",
    shadow: "shadow-slate-500/10",
    ring: "ring-slate-500/30",
  },
};

export interface DomainPreset {
  name: string;
  theme: DomainColorTheme;
  description: string;
  icon: string;
}

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    name: "Custom Domain",
    theme: "indigo",
    description: "Bounded domain container for grouping related tables",
    icon: "Layers",
  },
];

export function getDomainTheme(theme?: string): DomainThemeConfig {
  if (theme && theme in DOMAIN_THEMES) {
    return DOMAIN_THEMES[theme as DomainColorTheme];
  }
  return DOMAIN_THEMES.indigo;
}
