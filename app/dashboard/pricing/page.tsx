import { PricingTable } from '@clerk/nextjs'
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-[#ffee72] border-[#ffdf27]/30 bg-[#ffc507]/10 text-xs font-mono">
          Subscription Plans
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Upgrade to ArchFlow Pro
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Unlock unlimited architecture projects, live traffic simulators, SPOF reliability audits, and Terraform export.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <PricingTable />
      </div>
    </div>
  );
}
