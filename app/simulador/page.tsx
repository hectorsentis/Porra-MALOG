import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters } from "@/lib/public/filters";
import { getSimulatorData } from "@/lib/public/simulator";

export const dynamic = "force-dynamic";

export default async function SimuladorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters = {
    ...parsePublicFilters(raw),
    homeGoals: Array.isArray(raw.homeGoals) ? raw.homeGoals[0] : raw.homeGoals,
    awayGoals: Array.isArray(raw.awayGoals) ? raw.awayGoals[0] : raw.awayGoals,
    qualifiedTeamId: Array.isArray(raw.qualifiedTeamId) ? raw.qualifiedTeamId[0] : raw.qualifiedTeamId
  };
  const data = await getSimulatorData(filters);

  return (
    <PublicShell>
      <PageTitle title="Simulador" subtitle="Proyecciones en memoria: no guarda resultados ni modifica la clasificacion oficial." />
      <Card className="mb-4">
        <CardHeader><CardTitle>Escenario de partido</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_120px_120px_160px_120px]">
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Partido
              <select name="partido" defaultValue={data.selectedMatchId ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
                {data.availableMatches.map((match) => <option key={match.matchId} value={match.matchId}>{match.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Goles local
              <input name="homeGoals" type="number" min="0" defaultValue={data.homeGoals ?? ""} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Goles visitante
              <input name="awayGoals" type="number" min="0" defaultValue={data.awayGoals ?? ""} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clasificado
              <input name="qualifiedTeamId" defaultValue={filters.qualifiedTeamId ?? ""} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal normal-case tracking-normal text-slate-900" placeholder="Opcional" />
            </label>
            <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Simular</button>
          </form>
          {data.availableMatches.length === 0 ? <p className="mt-3 text-sm text-slate-600">No hay partidos pendientes disponibles para simular.</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ranking oficial actual</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {data.baseRanking.map((row) => (
                <div key={row.participantId} className="grid grid-cols-[40px_1fr_70px] items-center gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <strong className="text-primary">{row.pos}</strong><span className="truncate">{row.alias}</span><strong className="text-right">{row.pointsTotal}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ranking proyectado</CardTitle></CardHeader>
          <CardContent>
            {data.projected ? (
              <div className="grid gap-2">
                {data.projected.map((row) => (
                  <div key={row.participantId} className="grid grid-cols-[40px_1fr_70px_70px] items-center gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                    <strong className="text-primary">{row.pos}</strong><span className="truncate">{row.alias}</span><strong className="text-right">{row.pointsTotal}</strong><span className={row.deltaPoints > 0 ? "text-right font-semibold text-air-up" : "text-right text-slate-500"}>+{row.deltaPoints}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-600">Selecciona partido y marcador para calcular una proyeccion.</p>}
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
