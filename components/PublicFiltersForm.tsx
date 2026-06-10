import { Button } from "@/components/ui/button";
import { getPublicFilterOptions, type PublicFilters } from "@/lib/public/filters";

export async function PublicFiltersForm({
  filters,
  compact = false
}: {
  filters: PublicFilters;
  compact?: boolean;
}) {
  const options = await getPublicFilterOptions();
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
      {fields.map((field) => {
        const values = options[field] ?? [];
        return (
          <label key={field} className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {labels[field]}
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900"
              name={field}
              defaultValue={filters[field] ?? ""}
            >
              <option value="">Todos</option>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        );
      })}
      <Button>Filtrar</Button>
    </form>
  );
}
