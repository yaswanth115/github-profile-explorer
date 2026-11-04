import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
}

export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-3 p-5 transition-shadow hover:shadow-md">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{typeof value === "number" ? formatNumber(value) : value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="rounded-md bg-accent p-2 text-accent-foreground" aria-hidden="true">
        {icon}
      </div>
    </Card>
  );
}
