import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { SimpleBarChart, RarityScatterChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters } from "@/lib/public/filters";
import { getAdvancedStatistics } from "@/lib/public/statistics";

export const dynamic = "force-dynamic";

export default async function ApuestasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const stats = await getAdvancedStatistics(filters);

  return (
    <PublicShell>
      <PageTitle title="Apuestas" subtitle="Mercados elegidos, consensos y selecciones diferenciales." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/apuestas" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Campeon</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.champions.slice(0, 10)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Subcampeon</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.runnerUps.slice(0, 10)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Maximo goleador</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.scorers.slice(0, 10)} /></CardContent></Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Puntos actuales frente a rareza de apuesta</CardTitle></CardHeader>
        <CardContent><RarityScatterChart data={stats.bets.rarityByParticipant} /></CardContent>
      </Card>
    </PublicShell>
  );
}
