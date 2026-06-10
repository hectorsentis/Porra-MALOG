import Link from "next/link";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { activeFilterEntries, filterUrl, type PublicFilters } from "@/lib/public/filters";

export function FilterChips({ filters, basePath }: { filters: PublicFilters; basePath: string }) {
  const entries = activeFilterEntries(filters);
  if (entries.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {entries.map(([key, value]) => (
        <Link key={key} href={`${basePath}${filterUrl(filters, key)}`}>
          <Badge className="gap-1 bg-white text-slate-700">
            {key}: {value}
            <X className="h-3 w-3" aria-hidden />
          </Badge>
        </Link>
      ))}
      <Link className="text-sm font-semibold text-primary" href={basePath}>Limpiar filtros</Link>
    </div>
  );
}
