import Link from "next/link";
import { CountryLabel } from "@/components/CountryLabel";
import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { SimpleBarChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePublicFilters, type PublicFilters } from "@/lib/public/filters";
import { getBonusBetInsights, getGroupClassificationBetInsights, getGroupMatchBetInsights } from "@/lib/public/bets";
import { getMatchFilterOptions } from "@/lib/public/matches";

export const dynamic = "force-dynamic";

const tabs = [
  ["bonus", "Bonus inicial"],
  ["grupos", "Fase de grupos"],
  ["clasificacion", "Clasificacion de grupos"]
];

function tabHref(tab: string, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "tab") params.set(key, value);
  }
  params.set("tab", tab);
  return `/apuestas?${params.toString()}`;
}

async function ContextFilters({ filters, tab }: { filters: PublicFilters; tab: string }) {
  if (tab === "bonus") return <PublicFiltersForm filters={{ ...filters, tab }} compact />;
  const options = await getMatchFilterOptions();
  const fields = tab === "grupos" ? (["grupo", "jornada", "equipo"] as const) : (["grupo", "equipo"] as const);
  const labels = { grupo: "Grupo", jornada: "Jornada", equipo: "Equipo" };
  return (
    <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4">
      <input type="hidden" name="tab" value={tab} />
      {filters.resultado ? <input type="hidden" name="resultado" value={filters.resultado} /> : null}
      {fields.map((field) => (
        <label key={field} className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {labels[field]}
          <select name={field} defaultValue={filters[field] ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
            <option value="">Todos</option>
            {(options[field] ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ))}
      <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Filtrar</button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card><CardContent><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}

type GoalsStat = {
  average: number;
  min: number;
  max: number;
  mode: number;
  deviation: number;
};

type GoalsDistributionRow = { name: string; value: number };

function buildGoalBuckets(rows: GoalsDistributionRow[], bucketSize = 10) {
  const buckets = new Map<number, number>();
  for (const row of rows) {
    const goals = Number(row.name);
    if (!Number.isFinite(goals)) continue;
    const start = Math.floor(goals / bucketSize) * bucketSize;
    buckets.set(start, (buckets.get(start) ?? 0) + row.value);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, value]) => ({ name: `${start}-${start + bucketSize - 1}`, value }));
}

function TotalGoalsCard({ stats, distribution }: { stats: GoalsStat; distribution: GoalsDistributionRow[] }) {
  const buckets = buildGoalBuckets(distribution);
  const maxValue = Math.max(1, ...buckets.map((row) => row.value));
  const topExact = distribution.slice(0, 5);
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Total goles torneo</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Media</p><p className="mt-1 text-2xl font-bold text-slate-950">{stats.average}</p></div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Moda</p><p className="mt-1 text-2xl font-bold text-slate-950">{stats.mode}</p></div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Minimo</p><p className="mt-1 text-2xl font-bold text-slate-950">{stats.min}</p></div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Maximo</p><p className="mt-1 text-2xl font-bold text-slate-950">{stats.max}</p></div>
          <div className="col-span-2 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Valores mas repetidos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topExact.length > 0 ? topExact.map((row) => <span key={row.name} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{row.name}: {row.value}</span>) : <span className="text-xs text-slate-500">Sin apuestas registradas.</span>}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {buckets.length > 0 ? buckets.map((row) => (
            <div key={row.name} className="grid grid-cols-[72px_minmax(0,1fr)_36px] items-center gap-3 text-sm">
              <span className="font-semibold text-slate-600">{row.name}</span>
              <div className="h-7 overflow-hidden rounded-md bg-slate-100">
                <div className="flex h-full items-center rounded-md bg-primary px-2 text-xs font-semibold text-white" style={{ width: `${Math.max(8, Math.round((row.value / maxValue) * 100))}%` }}>
                  {row.value}
                </div>
              </div>
              <span className="text-right text-xs font-semibold text-slate-500">{Math.round((row.value / maxValue) * 100)}%</span>
            </div>
          )) : <p className="text-sm text-slate-600">Sin apuestas registradas.</p>}
        </div>
      </CardContent>
    </Card>
  );
}


type ResultVoteRow = {
  alias: string;
  departamento: string | null;
  rango: string | null;
  slug: string;
  matchId: string;
  matchNo: number | null;
  fase: string | null;
  grupo: string | null;
  jornadaId: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  prediction: string;
};

function resultHref(result: string, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === "resultado") continue;
    params.set(key, value);
  }
  params.set("tab", "grupos");
  params.set("resultado", result);
  return `/apuestas?${params.toString()}`;
}

function ClickableResultBars({ data, filters }: { data: Array<{ name: string; value: number }>; filters: PublicFilters }) {
  const maxValue = Math.max(1, ...data.map((row) => row.value));
  if (data.length === 0) return <p className="text-sm text-slate-600">Sin apuestas registradas.</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => {
        const active = filters.resultado === row.name;
        return (
          <Link key={row.name} href={resultHref(row.name, filters)} className={`group grid grid-cols-[52px_minmax(0,1fr)_36px] items-center gap-3 rounded-md px-2 py-1 text-sm transition ${active ? "bg-primary/10" : "hover:bg-slate-50"}`}>
            <span className="font-bold text-slate-800">{row.name}</span>
            <span className="h-8 overflow-hidden rounded-md bg-slate-100">
              <span className={`flex h-full items-center rounded-md px-2 text-xs font-semibold text-white transition ${active ? "bg-air-gold" : "bg-primary group-hover:bg-blue-900"}`} style={{ width: `${Math.max(10, Math.round((row.value / maxValue) * 100))}%` }}>
                {row.value}
              </span>
            </span>
            <span className="text-right text-xs font-semibold text-slate-500">Ver</span>
          </Link>
        );
      })}
    </div>
  );
}

function ResultVotesTable({ result, rows }: { result?: string; rows: ResultVoteRow[] }) {
  if (!result) return <p className="mt-3 text-xs text-slate-500">Pulsa un resultado para ver quien lo ha apostado.</p>;
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">Apostaron {result}</p>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{rows.length} votos</span>
      </div>
      {rows.length > 0 ? (
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Alias</th><th className="px-3 py-2">Departamento</th><th className="px-3 py-2">Rango</th><th className="px-3 py-2">Partido</th><th className="px-3 py-2">Fase</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.slug}-${row.matchId}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold"><Link className="text-primary hover:underline" href={`/participantes/${row.slug}`}>{row.alias}</Link></td>
                  <td className="px-3 py-2">{row.departamento ?? "-"}</td>
                  <td className="px-3 py-2">{row.rango ?? "-"}</td>
                  <td className="px-3 py-2">{row.homeTeam ? <CountryLabel value={row.homeTeam} /> : "Local"} - {row.awayTeam ? <CountryLabel value={row.awayTeam} /> : "Visitante"}</td>
                  <td className="px-3 py-2">{row.fase ?? row.jornadaId ?? row.grupo ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-3 py-4 text-sm text-slate-600">No hay jugadores para este marcador con los filtros actuales.</p>}
    </div>
  );
}
export default async function ApuestasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const activeTab = filters.tab && ["bonus", "grupos", "clasificacion"].includes(filters.tab) ? filters.tab : "bonus";
  const [bonus, groupMatches, groupClassification] = await Promise.all([
    activeTab === "bonus" ? getBonusBetInsights(filters) : Promise.resolve(null),
    activeTab === "grupos" ? getGroupMatchBetInsights(filters) : Promise.resolve(null),
    activeTab === "clasificacion" ? getGroupClassificationBetInsights(filters) : Promise.resolve(null)
  ]);
  const bonusCharts = bonus ? [
    ["Campeon", bonus.champions],
    ["Subcampeon", bonus.runnerUps],
    ["Semifinalistas", bonus.semifinalists],
    ["Semifinalista 1", bonus.semifinalist1],
    ["Semifinalista 2", bonus.semifinalist2],
    ["Semifinalista 3", bonus.semifinalist3],
    ["Semifinalista 4", bonus.semifinalist4],
    ["Maximo goleador", bonus.scorers],
    ["Seleccion mas goleadora", bonus.mostScoring],
    ["Seleccion menos goleadora", bonus.leastScoring],
    ["Seleccion mas goleada", bonus.mostConceded],
    ["Seleccion menos goleada", bonus.leastConceded],
    ["Equipo revelacion", bonus.revelation],
    ["Equipo decepcion", bonus.disappointment],
    ["Hype score", bonus.hype],
    ["Desconfianza", bonus.distrust]
  ] as const : [];

  return (
    <PublicShell>
      <PageTitle title="Apuestas" subtitle="Lectura de bonus inicial, partidos de fase de grupos y clasificacion apostada." />
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link key={key} href={tabHref(key, filters)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"}`}>{label}</Link>
        ))}
      </nav>
      <ContextFilters filters={filters} tab={activeTab} />
      <FilterChips filters={{ ...filters, tab: activeTab }} basePath="/apuestas" />

      {bonus ? (
        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Apuestas bonus" value={bonus.totalBets} />
            <Stat label="Goles media" value={bonus.totalGoals.average} />
            <Stat label="Goles min/max" value={`${bonus.totalGoals.min}/${bonus.totalGoals.max}`} />
            <Stat label="Moda goles" value={bonus.totalGoals.mode} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <TotalGoalsCard stats={bonus.totalGoals} distribution={bonus.totalGoalsDistribution} />
            {bonusCharts.map(([title, chartData]) => (
              <Card key={title}>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent>{chartData.length > 0 ? <SimpleBarChart data={chartData.slice(0, 10)} /> : <p className="text-sm text-slate-600">Sin apuestas registradas.</p>}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {groupMatches ? (
        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Apuestas partido" value={groupMatches.totalBets} />
            <Stat label="Resultado mas apostado" value={groupMatches.prediction.mostPredictedResult} />
            <Stat label="Media goles local" value={groupMatches.averageHomeGoals} />
            <Stat label="Media goles visitante" value={groupMatches.averageAwayGoals} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle>Tendencia 1-X-2</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.prediction.signRows} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Top resultados</CardTitle></CardHeader><CardContent><ClickableResultBars data={groupMatches.topResults.slice(0, 10)} filters={{ ...filters, tab: activeTab }} /><ResultVotesTable result={groupMatches.selectedResult} rows={groupMatches.resultVotes} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Jugadores resultadistas</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.resultadistas.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Jugadores amarrategui</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.amarrategui.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Equipos mas confiados</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.trusted.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Equipos mas despreciados</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.despised.slice(0, 10)} /></CardContent></Card>
          </div>
        </section>
      ) : null}

      {groupClassification ? (
        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Apuestas clasificacion" value={groupClassification.totalBets} />
            <Stat label="Favorito de grupo" value={groupClassification.first[0]?.name ?? "-"} />
            <Stat label="Mas hundido" value={groupClassification.fourth[0]?.name ?? "-"} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Primeros de grupo</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupClassification.first.slice(0, 12)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Ultimos de grupo</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupClassification.fourth.slice(0, 12)} /></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Posicion media apostada</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Equipo</th><th className="px-3 py-2">Media pos.</th><th className="px-3 py-2">1o</th><th className="px-3 py-2">2o</th><th className="px-3 py-2">3o</th><th className="px-3 py-2">4o</th><th className="px-3 py-2">Confianza</th></tr></thead>
                  <tbody>{groupClassification.table.slice(0, 30).map((row) => <tr key={row.team} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold"><CountryLabel value={row.team} /></td><td className="px-3 py-2">{row.averagePos}</td><td className="px-3 py-2">{row.first}</td><td className="px-3 py-2">{row.second}</td><td className="px-3 py-2">{row.third}</td><td className="px-3 py-2">{row.fourth}</td><td className="px-3 py-2">{row.confidence}</td></tr>)}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </PublicShell>
  );
}




