import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { ParticipantEvolutionChart, SimpleBarChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters } from "@/lib/public/filters";
import { getDailyEvolution, getParticipantPointsEvolution } from "@/lib/public/temporal";

export const dynamic = "force-dynamic";

const LEGEND_COLORS = ["#1565C0", "#C8A84B", "#4CAF50", "#EF5350", "#42A5F5"];

function legendColor(index: number, total: number) {
  if (index < LEGEND_COLORS.length) return LEGEND_COLORS[index];
  const hue = (index * 360) / Math.max(total, 1);
  return `hsl(${Math.round(hue % 360)}, 65%, 55%)`;
}

export default async function EvolucionPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const history = await getDailyEvolution(filters);
  const participantEvolution = await getParticipantPointsEvolution(filters);

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
          <CardHeader><CardTitle>Evolucion diaria por participante</CardTitle></CardHeader>
          <CardContent>
            {participantEvolution.rows.length > 0 ? (
              <>
                <ParticipantEvolutionChart data={participantEvolution.rows} series={participantEvolution.participants} />
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  {participantEvolution.participants.map((alias, index) => (
                    <span key={alias} className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: legendColor(index, participantEvolution.participants.length) }}
                      />
                      {alias}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">La evolucion por participante comenzara con el primer resultado oficial publicado.</p>
            )}
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
