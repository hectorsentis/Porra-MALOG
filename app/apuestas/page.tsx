import Link from "next/link";
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
      {fields.map((field) => (
        <label key={field} className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {labels[field]}
          <select name={field} defaultValue={filters[field] ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
            <option value="">Todos</option>
            {(options[field] ?? []).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ))}
      <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-white">Filtrar</button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <Card><CardContent><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
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

  return (
    <PublicShell>
      <PageTitle title="Apuestas" subtitle="Lectura de bonus inicial, partidos de fase de grupos y clasificacion apostada." />
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link key={key} href={tabHref(key, filters)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700"}`}>{label}</Link>
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
            <Card><CardHeader><CardTitle>Campeon</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.champions.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Subcampeon</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.runnerUps.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Semifinalistas</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.semifinalists.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Equipo revelacion</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.revelation.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Equipo decepcion</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.disappointment.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Hype score</CardTitle></CardHeader><CardContent><SimpleBarChart data={bonus.hype.slice(0, 10)} /></CardContent></Card>
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
            <Card><CardHeader><CardTitle>Top resultados</CardTitle></CardHeader><CardContent><SimpleBarChart data={groupMatches.topResults.slice(0, 10)} /></CardContent></Card>
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
                  <tbody>{groupClassification.table.slice(0, 30).map((row) => <tr key={row.team} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.team}</td><td className="px-3 py-2">{row.averagePos}</td><td className="px-3 py-2">{row.first}</td><td className="px-3 py-2">{row.second}</td><td className="px-3 py-2">{row.third}</td><td className="px-3 py-2">{row.fourth}</td><td className="px-3 py-2">{row.confidence}</td></tr>)}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </PublicShell>
  );
}
