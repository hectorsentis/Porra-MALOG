import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { EvolutionLineChart, SimpleBarChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters } from "@/lib/public/filters";
import { getAdvancedStatistics } from "@/lib/public/statistics";

export const dynamic = "force-dynamic";

export default async function EvolucionPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const stats = await getAdvancedStatistics(filters);

  return (
    <PublicShell>
      <PageTitle title="Evolucion" subtitle="Historico de posiciones, puntos y movimientos por evento oficial." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/evolucion" />
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Evolucion de posicion y puntos</CardTitle></CardHeader>
          <CardContent>
            {stats.history.length > 0 ? <EvolutionLineChart data={stats.history.slice(-100)} /> : <p className="text-sm text-slate-600">El historico comenzara con el primer resultado oficial publicado.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Puntos ganados por evento</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={stats.history.slice(-40)} nameKey="eventLabel" valueKey="pointsGainedThisRun" /></CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
