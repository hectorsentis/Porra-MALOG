import Link from "next/link";
import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AccuracyChart,
  DistributionChart,
  EvolutionLineChart,
  PointCompositionChart,
  RankingDensityChart,
  RarityScatterChart,
  SimpleBarChart,
  PrizePieChart
} from "@/components/statistics/StatisticsCharts";
import { parsePublicFilters, type PublicFilters } from "@/lib/public/filters";
import { getAdvancedStatistics } from "@/lib/public/statistics";

export const dynamic = "force-dynamic";

const tabs = [
  ["resumen", "Resumen"],
  ["puntos", "Puntos"],
  ["aciertos", "Aciertos"],
  ["evolucion", "Evolucion"],
  ["departamentos", "Departamentos"],
  ["apuestas", "Apuestas"],
  ["volatilidad", "Volatilidad"],
  ["bote", "Bote"]
];

function tabHref(tab: string, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "tab") params.set(key, value);
  }
  params.set("tab", tab);
  return `/estadisticas?${params.toString()}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function EstadisticasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const activeTab = filters.tab ?? "resumen";
  const stats = await getAdvancedStatistics(filters);
  const currency = stats.bote.currency ?? "EUR";
  const hasResults = stats.ranking.some((row) => row.pointsTotal > 0);
  const podiumStyles = [
    "border-2 border-[var(--ea-gold-light)] bg-[var(--ea-gold-light)]/10",
    "border-2 border-slate-300/40 bg-white/5",
    "border-2 border-[#CD7F32]/60 bg-[#CD7F32]/10"
  ];
  const accuracyTable = stats.accuracy
    .map((row, index) => ({ ...row, pos: stats.ranking[index]?.pos ?? index + 1, slug: stats.ranking[index]?.slug }))
    .sort((a, b) => b.hitRate - a.hitRate || b.exactScores - a.exactScores);
  const prizeData = [
    { name: "Primer premio", value: stats.bote.first },
    { name: "Segundo premio", value: stats.bote.second },
    { name: "Tercer premio", value: stats.bote.third },
    { name: "Consolacion", value: stats.bote.consolation ?? 0 }
  ].filter((row) => row.value > 0);

  return (
    <PublicShell>
      <PageTitle title="Estadisticas" subtitle="Analisis de clasificacion, apuestas, evolucion y bote." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/estadisticas" />
      {!hasResults ? (
        <Card className="mb-4 border-air-gold bg-[var(--color-warning)]/10">
          <CardContent>
            <p className="text-sm text-air-gold">
              Aun no hay resultados oficiales computados. Los graficos de aciertos, evolucion y volatilidad se iran rellenando partido a partido en cuanto se publiquen los primeros marcadores.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key, filters)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {activeTab === "resumen" ? (
        <section className="grid gap-4">
          {stats.ranking.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.ranking.slice(0, 3).map((row, index) => (
                <Card key={row.slug} className={podiumStyles[index]}>
                  <CardContent>
                    <p className="text-xs uppercase text-slate-500">Posicion #{row.pos}</p>
                    <Link href={`/participantes/${row.slug}`} className="block truncate text-lg font-bold text-primary">{row.alias}</Link>
                    <p className="text-3xl font-bold">{row.pointsTotal} <span className="text-sm font-normal text-slate-500">pts</span></p>
                    <p className="text-xs text-slate-500">{row.departamento ?? "Sin departamento"} - {row.rango ?? "Sin rango"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Media" value={stats.summary.average} />
            <Stat label="Mediana" value={stats.summary.median} />
            <Stat label="Desviacion" value={stats.summary.deviation} />
            <Stat label="Mayor salto" value={stats.summary.biggestGap} />
          </div>
          <Card>
            <CardHeader><CardTitle>Distribucion de puntos</CardTitle></CardHeader>
            <CardContent><DistributionChart data={stats.ranking.slice(0, 25)} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Densidad de clasificacion</CardTitle></CardHeader>
            <CardContent><RankingDensityChart data={stats.summary.leaderGap.slice(0, 25)} /></CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "puntos" ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Composicion de puntos por jugador</CardTitle></CardHeader>
            <CardContent><PointCompositionChart data={stats.pointComposition.slice(0, 25)} /></CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Top partidos</CardTitle></CardHeader><CardContent><SimpleBarChart data={[...stats.pointComposition].sort((a, b) => b.partidos - a.partidos).slice(0, 12)} nameKey="alias" valueKey="partidos" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Top bonus</CardTitle></CardHeader><CardContent><SimpleBarChart data={[...stats.pointComposition].sort((a, b) => b.bonus - a.bonus).slice(0, 12)} nameKey="alias" valueKey="bonus" /></CardContent></Card>
          </div>
        </section>
      ) : null}

      {activeTab === "aciertos" ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Aciertos por participante</CardTitle></CardHeader>
            <CardContent><AccuracyChart data={stats.accuracy.slice(0, 25)} /></CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {stats.accuracy.slice(0, 9).map((row) => (
              <Card key={row.alias}><CardContent><p className="font-bold">{row.alias}</p><p className="text-sm text-slate-600">Exactos {row.exactScores} - Signos {row.correctSigns} - Dif {row.correctDiff}</p></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Ranking de precision</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Alias</th>
                    <th className="px-3 py-2">Exactos</th>
                    <th className="px-3 py-2">Signos</th>
                    <th className="px-3 py-2">Diferencias</th>
                    <th className="px-3 py-2">Clasif. grupo</th>
                    <th className="px-3 py-2">% Acierto</th>
                  </tr>
                </thead>
                <tbody>
                  {accuracyTable.map((row) => (
                    <tr key={row.alias} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-primary">#{row.pos}</td>
                      <td className="px-3 py-2">{row.slug ? <Link className="font-semibold text-primary" href={`/participantes/${row.slug}`}>{row.alias}</Link> : row.alias}</td>
                      <td className="px-3 py-2">{row.exactScores}</td>
                      <td className="px-3 py-2">{row.correctSigns}</td>
                      <td className="px-3 py-2">{row.correctDiff}</td>
                      <td className="px-3 py-2">{row.groupQualified}</td>
                      <td className="px-3 py-2 font-bold">{row.hitRate}%</td>
                    </tr>
                  ))}
                  {accuracyTable.length === 0 ? <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-slate-500">Sin datos disponibles.</td></tr> : null}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "evolucion" ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Evolucion historica</CardTitle></CardHeader>
            <CardContent>
              {stats.history.length > 0 ? <EvolutionLineChart data={stats.history.slice(-80)} /> : <p className="text-sm text-slate-600">El historico se activara con el primer resultado oficial publicado.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Puntos ganados por evento</CardTitle></CardHeader>
            <CardContent><SimpleBarChart data={stats.history.slice(-30)} nameKey="eventLabel" valueKey="pointsGainedThisRun" /></CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "departamentos" ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Media por departamento</CardTitle></CardHeader>
            <CardContent><SimpleBarChart data={stats.departments} nameKey="departamento" valueKey="average" /></CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-3">
            {stats.departments.map((row) => (
              <Card key={row.departamento}><CardContent><p className="font-bold">{row.departamento}</p><p className="text-sm text-slate-600">MVP {row.mvp} - Min {row.min} - Media {row.average} - Max {row.max}</p></CardContent></Card>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "apuestas" ? (
        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle>Campeon elegido</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.champions.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Subcampeon elegido</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.runnerUps.slice(0, 10)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Maximo goleador</CardTitle></CardHeader><CardContent><SimpleBarChart data={stats.bets.scorers.slice(0, 10)} /></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Puntos actuales frente a rareza de apuesta</CardTitle></CardHeader>
            <CardContent><RarityScatterChart data={stats.bets.rarityByParticipant} /></CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "volatilidad" ? (
        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Mayor subida</CardTitle></CardHeader><CardContent><SimpleBarChart data={[...stats.volatility].sort((a, b) => b.deltaPos - a.deltaPos).slice(0, 12)} nameKey="alias" valueKey="deltaPos" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Movimiento medio</CardTitle></CardHeader><CardContent><SimpleBarChart data={[...stats.volatility].sort((a, b) => b.averageMovement - a.averageMovement).slice(0, 12)} nameKey="alias" valueKey="averageMovement" /></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle>Desviacion de puntos</CardTitle></CardHeader><CardContent><SimpleBarChart data={[...stats.volatility].sort((a, b) => b.pointsStd - a.pointsStd).slice(0, 12)} nameKey="alias" valueKey="pointsStd" /></CardContent></Card>
        </section>
      ) : null}

      {activeTab === "bote" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader><CardTitle>Distribucion de premios</CardTitle></CardHeader>
            <CardContent>{prizeData.length ? <PrizePieChart data={prizeData} /> : <p className="text-sm text-slate-600">Premios pendientes de configurar.</p>}</CardContent>
          </Card>
          <div className="grid gap-3">
            <Stat label="Bote total" value={`${stats.bote.total.toFixed(2)} ${currency}`} />
            <Stat label="Premios asignados" value={`${stats.bote.prizeSum.toFixed(2)} ${currency}`} />
            <Stat label="Primer premio" value={`${stats.bote.first.toFixed(2)} ${currency}`} />
            <Stat label="Consolacion" value={`${(stats.bote.consolation ?? 0).toFixed(2)} ${currency}`} />
          </div>
        </section>
      ) : null}
    </PublicShell>
  );
}
