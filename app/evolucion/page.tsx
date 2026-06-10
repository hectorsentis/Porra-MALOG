import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { SimpleBarChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters } from "@/lib/public/filters";
import { getDailyEvolution } from "@/lib/public/temporal";

export const dynamic = "force-dynamic";

export default async function EvolucionPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const history = await getDailyEvolution(filters);

  return (
    <PublicShell>
      <PageTitle title="Evolucion" subtitle="Puntos y aciertos agrupados por dia real de partidos oficiales." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/evolucion" />
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Puntos por dia de partido</CardTitle></CardHeader>
          <CardContent>
            {history.length > 0 ? <SimpleBarChart data={history} nameKey="day" valueKey="pointsTotal" /> : <p className="text-sm text-slate-600">La evolucion diaria comenzara con el primer resultado oficial publicado.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Detalle diario</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr><th className="px-3 py-2">Dia</th><th className="px-3 py-2">Puntos</th><th className="px-3 py-2">Exactos</th><th className="px-3 py-2">Signos</th><th className="px-3 py-2">Dif.</th><th className="px-3 py-2">Cruces</th><th className="px-3 py-2">Jugador del dia</th></tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.day} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold">{row.day}</td>
                      <td className="px-3 py-2 font-bold">{row.pointsTotal}</td>
                      <td className="px-3 py-2">{row.exactScores}</td>
                      <td className="px-3 py-2">{row.correctSigns}</td>
                      <td className="px-3 py-2">{row.correctDiff}</td>
                      <td className="px-3 py-2">{row.correctCruces}</td>
                      <td className="px-3 py-2">{row.topAlias ? `${row.topAlias} (${row.topPoints})` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
