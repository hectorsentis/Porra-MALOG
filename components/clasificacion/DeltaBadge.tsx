import { Badge } from "@/components/ui/badge";

export function DeltaBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">—</span>;
  const className = value > 0 ? "text-air-up" : value < 0 ? "text-air-down" : "text-slate-500";
  const sign = value > 0 ? "+" : "";
  return <Badge className={className}>{value === 0 ? "=" : `${sign}${value}`}</Badge>;
}
