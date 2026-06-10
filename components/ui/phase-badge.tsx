import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function phaseClass(fase: string) {
  const value = fase.toLocaleUpperCase("es-ES");
  if (value.includes("FINAL")) return "border-[var(--ea-gold-light)] text-[var(--ea-gold-light)]";
  if (value.includes("GRUPO")) return "border-air-light text-air-light";
  return "border-air-gold text-air-gold";
}

export function PhaseBadge({ fase, className }: { fase?: string | null; className?: string }) {
  if (!fase) return <Badge className={cn("text-slate-500", className)}>Fase</Badge>;
  return <Badge className={cn(phaseClass(fase), className)}>{fase}</Badge>;
}
