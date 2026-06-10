import { Button } from "@/components/ui/button";
import type { PublicFilters } from "@/lib/public/filters";

export function PublicFiltersForm({
  filters,
  compact = false
}: {
  filters: PublicFilters;
  compact?: boolean;
}) {
  const fields = compact
    ? (["alias", "departamento", "rango"] as const)
    : (["alias", "departamento", "rango", "fase", "jornada", "grupo", "equipo"] as const);
  const labels: Record<(typeof fields)[number], string> = {
    alias: "Alias",
    departamento: "Departamento",
    rango: "Rango",
    fase: "Fase",
    jornada: "Jornada",
    grupo: "Grupo",
    equipo: "Equipo"
  } as Record<(typeof fields)[number], string>;

  return (
    <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4">
      {filters.tab ? <input type="hidden" name="tab" value={filters.tab} /> : null}
      {fields.map((field) => (
        <input
          key={field}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
          name={field}
          defaultValue={filters[field] ?? ""}
          placeholder={labels[field]}
        />
      ))}
      <Button>Filtrar</Button>
    </form>
  );
}
